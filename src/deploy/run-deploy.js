import FTP from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { withLogger } from '../logger.js';
import { loadEnvForEnvironment } from '../config/load-env.js';
import { isValidEnvironment, listEnvironments } from '../env/resolve.js';

export class SimpleFTPDeployer {
  constructor(environment, options = {}) {
    this.environment = environment;
    this.rootDir = options.rootDir || process.cwd();
    this.logger = withLogger(options.logger);
    this.buildDir = options.buildDir || `public_${environment}`;
    this.confirm = options.confirm === true;

    this.client = new FTP.Client();
    this.config = null;
    this.totalFiles = 0;
    this.uploadedFiles = 0;

    this.client.ftp.verbose = this.logger.shouldLog?.('verbose') ?? false;
    this.client.trackProgress((info) => {
      this.uploadedFiles++;
      if (this.logger.shouldLog?.('normal')) {
        const progress = Math.round((this.uploadedFiles / Math.max(1, this.totalFiles)) * 100);
        this.logger.info(`📤 [${progress}%] ${info.name}`);
      }
    });
  }

  parseBoolean(value) {
    return value === 'true' || value === '1' || value === 'yes';
  }

  buildAbsolutePath(relativeOrAbsolutePath) {
    if (path.isAbsolute(relativeOrAbsolutePath)) {
      return relativeOrAbsolutePath;
    }

    return path.join(this.rootDir, relativeOrAbsolutePath);
  }

  loadConfig() {
    this.logger.buildStep('🔧', `Loading configuration for ${this.environment} environment`);

    let envResult;
    try {
      envResult = loadEnvForEnvironment({
        rootDir: this.rootDir,
        environment: this.environment,
        logger: this.logger,
        requirePublic: true,
        apply: true,
        preserveExisting: false
      });
    } catch (error) {
      throw new Error(error.message);
    }

    const {
      publicEnvVars,
      privateEnvVars,
      loadedFiles,
      paths
    } = envResult;

    if (loadedFiles.some((file) => file.endsWith('.local'))) {
      this.logger.verbose?.(`✅ Loaded private credentials: ${paths.envLocalPath}`);
    } else {
      this.logger.buildWarning('⚠️', `Private config file not found: ${paths.envLocalPath}`);
      this.logger.buildWarning('⚠️', 'Create this file with your FTP credentials');
    }

    this.logger.verbose?.(`✅ Loaded public config: ${paths.envPath}`);

    const merged = {
      ...publicEnvVars,
      ...privateEnvVars,
      ...process.env
    };

    this.config = {
      ftp: {
        host: merged.FTP_HOST,
        port: parseInt(merged.FTP_PORT || '21', 10),
        user: merged.FTP_USER,
        password: merged.FTP_PASSWORD,
        rootPath: merged.FTP_ROOT_PATH,
        secure: this.parseBoolean(merged.FTP_SECURE || 'false'),
        secureOptions: {},
        pasv: this.parseBoolean(merged.FTP_USE_PASSIVE || 'true'),
        timeout: parseInt(merged.FTP_TIMEOUT || '30000', 10)
      }
    };

    const required = ['host', 'user', 'password', 'rootPath'];
    const missing = required.filter((key) => !this.config.ftp[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required FTP configuration: ${missing.join(', ')}`);
    }

    this.logger.buildSuccess('✅', 'Configuration loaded successfully');
    this.logger.verbose?.(`FTP Host: ${this.config.ftp.host}:${this.config.ftp.port}`);
    this.logger.verbose?.(`FTP Path: ${this.config.ftp.rootPath}`);
    this.logger.verbose?.(`FTP Secure: ${this.config.ftp.secure}`);

    return this.config;
  }

  verifyBuild() {
    this.logger.buildStep('📁', `Checking build directory: ${this.buildDir}`);

    const buildDirPath = this.buildAbsolutePath(this.buildDir);

    if (!fs.existsSync(buildDirPath)) {
      throw new Error(`Build directory ${this.buildDir} not found. Run build first: npm run build:${this.environment}`);
    }

    this.fullBuildDir = buildDirPath;
    this.totalFiles = this.countFiles(this.fullBuildDir);
    this.logger.buildSuccess('✅', `Build directory verified (${this.totalFiles} files)`);
  }

  countFiles(dir) {
    let count = 0;
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        count += this.countFiles(fullPath);
      } else {
        count++;
      }
    }

    return count;
  }

  async connectWithRetry(maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.buildStep('🔗', `Connecting to FTP server (attempt ${attempt}/${maxRetries})`);
        this.logger.verbose?.(`Host: ${this.config.ftp.host}:${this.config.ftp.port}`);

        await this.client.access(this.config.ftp);
        this.logger.buildSuccess('✅', 'Connected to FTP server');
        return;
      } catch (error) {
        if (attempt === maxRetries) {
          this.handleConnectionError(error);
          throw error;
        }

        this.logger.buildWarning('⚠️', `Connection failed: ${error.message}`);
        this.logger.buildWarning('⚠️', 'Retrying in 2 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  handleConnectionError(error) {
    if (error.code === 'ECONNREFUSED') {
      this.logger.buildError('❌', 'Cannot connect to FTP server. Check host and port settings.');
    } else if (error.code === 'ENOTFOUND') {
      this.logger.buildError('❌', 'FTP host not found. Check FTP_HOST setting.');
    } else if (String(error.message || '').includes('530')) {
      this.logger.buildError('❌', 'Login failed. Check FTP_USER and FTP_PASSWORD.');
    } else if (String(error.message || '').includes('timeout')) {
      this.logger.buildError('❌', 'Connection timeout. Check FTP server or increase FTP_TIMEOUT.');
    } else {
      this.logger.buildError('❌', `FTP connection failed: ${error.message}`);
    }
  }

  async clearRemoteDirectory(remotePath) {
    try {
      this.logger.buildStep('🗑️', `Deleting all files in remote directory: ${remotePath}`);

      const files = await this.client.list(remotePath);
      this.logger.verbose?.(`Found ${files.length} items to delete`);

      if (files.length === 0) {
        this.logger.buildSuccess('✅', 'Remote directory is already empty');
        return;
      }

      const filesToDelete = files.filter((f) => !f.isDirectory);
      const dirsToDelete = files.filter((f) => f.isDirectory);

      for (const file of filesToDelete) {
        await this.client.remove(`${remotePath}/${file.name}`);
        this.logger.verbose?.(`Deleted file: ${file.name}`);
      }

      for (const dir of dirsToDelete) {
        await this.client.removeDir(`${remotePath}/${dir.name}`);
        this.logger.verbose?.(`Deleted directory: ${dir.name}`);
      }

      this.logger.buildSuccess('✅', `Deleted ${files.length} items from remote directory`);
    } catch (error) {
      if (error.code === 550) {
        this.logger.verbose?.(`Note: Remote directory might not exist or be empty: ${error.message}`);
      } else {
        this.logger.buildWarning('⚠️', `Warning during cleanup: ${error.message}`);
      }
    }
  }

  async uploadFiles() {
    this.logger.buildStep('📤', `Uploading files from ${this.buildDir} to ${this.config.ftp.rootPath}`);
    this.uploadedFiles = 0;

    try {
      await this.client.uploadFromDir(this.fullBuildDir, this.config.ftp.rootPath);
      this.logger.buildSuccess('✅', `Successfully uploaded ${this.uploadedFiles} files`);
    } catch (error) {
      this.logger.buildError('❌', `Upload failed: ${error.message}`);
      throw error;
    }
  }

  countRemoteFiles(files) {
    return files.filter((f) => !f.isDirectory).length +
      files.filter((f) => f.isDirectory).reduce((count) => count, 0);
  }

  async verifyDeployment() {
    this.logger.buildStep('🔍', 'Verifying deployment');

    try {
      const remoteFiles = await this.client.list(this.config.ftp.rootPath);
      const remoteFileCount = this.countRemoteFiles(remoteFiles);

      if (remoteFileCount === this.totalFiles) {
        this.logger.buildSuccess('✅', `Deployment verified: ${remoteFileCount} files uploaded`);
      } else {
        this.logger.buildWarning('⚠️', `File count mismatch: expected ${this.totalFiles}, found ${remoteFileCount}`);
      }

      return remoteFileCount;
    } catch (error) {
      this.logger.buildWarning('⚠️', `Could not verify deployment: ${error.message}`);
      return -1;
    }
  }

  async askProductionConfirmation() {
    if (this.environment !== 'production') {
      return true;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question =
      `\n⚠️  PRODUCTION DEPLOYMENT CONFIRMATION ⚠️\n` +
      `You are about to deploy to production:\n` +
      `  • Environment: ${this.environment}\n` +
      `  • FTP Host: ${this.config.ftp.host}\n` +
      `  • Remote Path: ${this.config.ftp.rootPath}\n` +
      `  • Files: ${this.totalFiles} files will be uploaded\n\n` +
      `This will DELETE ALL existing files and upload fresh content.\n` +
      `Type 'yes' to continue: `;

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      });
    });
  }

  async deploy() {
    const startTime = Date.now();

    try {
      this.loadConfig();

      if (!this.skipBuildCheck) {
        this.verifyBuild();
      }

      if (!this.confirm) {
        const confirmed = await this.askProductionConfirmation();
        if (!confirmed) {
          this.logger.buildWarning('⚠️', 'Deployment cancelled by user');
          return;
        }
      }

      await this.connectWithRetry();
      await this.clearRemoteDirectory(this.config.ftp.rootPath);
      await this.uploadFiles();
      await this.verifyDeployment();

      const deployTime = Math.round((Date.now() - startTime) / 1000);
      this.logger.buildSuccess('🎉', 'Deployment completed successfully!');
      this.logger.info?.('📊 Deployment Summary:');
      this.logger.info?.(`   Environment: ${this.environment}`);
      this.logger.info?.(`   Files uploaded: ${this.uploadedFiles}`);
      this.logger.info?.(`   Deploy time: ${deployTime}s`);
      this.logger.info?.(`   Target: ${this.config.ftp.host}${this.config.ftp.rootPath}`);
    } catch (error) {
      this.logger.buildError('❌', `Deployment failed: ${error.message}`);
      throw error;
    } finally {
      this.client.close();
    }
  }
}

export async function runDeployFromCli({
  rootDir = process.cwd(),
  logger,
  args = process.argv.slice(2)
} = {}) {
  const safeLogger = withLogger(logger);

  const environment = args[0];
  if (!environment) {
    safeLogger.error('❌ Environment is required!');
    safeLogger.error('Usage: node scripts/deploy.js <environment> [--confirm]');
    safeLogger.error('');
    safeLogger.error('Available environments:');
    listEnvironments(rootDir).forEach((env) => safeLogger.error(`  ✅ ${env}`));
    process.exit(1);
  }

  if (!isValidEnvironment(environment, rootDir)) {
    safeLogger.error(`❌ Invalid environment: ${environment}`);
    safeLogger.error(`Available environments: ${listEnvironments(rootDir).join(', ')}`);
    process.exit(1);
  }

  safeLogger.buildStart?.(`FTP Deployment - ${environment.toUpperCase()}`);

  process.on('unhandledRejection', (reason, promise) => {
    safeLogger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  process.on('uncaughtException', (error) => {
    safeLogger.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });

  const confirm = args.includes('--confirm');
  const deployer = new SimpleFTPDeployer(environment, {
    rootDir,
    logger: safeLogger,
    confirm
  });

  await deployer.deploy();
  return deployer;
}
