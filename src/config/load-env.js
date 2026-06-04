import fs from 'fs';
import path from 'path';
import { withLogger } from '../logger.js';

export function parseEnvFile(filePath) {
  const envVars = {};
  const envContent = fs.readFileSync(filePath, 'utf8');

  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

  return envVars;
}

export function loadEnvForEnvironment({
  rootDir,
  environment,
  logger,
  requirePublic = false,
  apply = true,
  preserveExisting = false
}) {
  const log = withLogger(logger);
  const envFile = `.env.${environment}`;
  const envLocalFile = `.env.${environment}.local`;
  const envPath = path.join(rootDir, 'config', 'env', envFile);
  const envLocalPath = path.join(rootDir, 'config', 'env', envLocalFile);

  let publicEnvVars = {};
  let privateEnvVars = {};

  if (fs.existsSync(envPath)) {
    publicEnvVars = parseEnvFile(envPath);
  } else if (requirePublic) {
    throw new Error(`Public config file not found: ${envPath}`);
  }

  if (fs.existsSync(envLocalPath)) {
    privateEnvVars = parseEnvFile(envLocalPath);
  }

  const loadedFiles = [];
  if (Object.keys(publicEnvVars).length > 0 || fs.existsSync(envPath)) {
    loadedFiles.push(envFile);
  }
  if (Object.keys(privateEnvVars).length > 0 || fs.existsSync(envLocalPath)) {
    loadedFiles.push(envLocalFile);
  }

  const envVars = {
    ...publicEnvVars,
    ...privateEnvVars
  };

  if (apply) {
    Object.entries(envVars).forEach(([key, value]) => {
      if (preserveExisting && process.env[key] !== undefined) {
        return;
      }

      process.env[key] = value;
    });
  }

  log.verbose(`Loaded environment files: ${loadedFiles.join(', ') || 'none'}`);

  return {
    envVars,
    publicEnvVars,
    privateEnvVars,
    loadedFiles,
    paths: {
      envPath,
      envLocalPath
    }
  };
}
