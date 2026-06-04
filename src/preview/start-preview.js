import fs from 'fs';
import path from 'path';
import http from 'http';
import { withLogger } from '../logger.js';
import { loadEnvForEnvironment } from '../config/load-env.js';
import { isValidEnvironment, listEnvironments } from '../env/resolve.js';

export class PreviewServer {
  constructor({ rootDir, environment, logger, editorAdapter }) {
    this.rootDir = rootDir;
    this.logger = withLogger(logger);
    this.editorAdapter = editorAdapter || null;

    this.environment = environment;
    this.port = null;
    this.publicDir = null;
    this.server = null;
    this.editorConfig = null;
    this.buildService = null;

    if (!isValidEnvironment(this.environment, this.rootDir)) {
      const available = listEnvironments(this.rootDir).join(', ');
      throw new Error(`Invalid environment: ${this.environment}. Available: ${available}`);
    }

    this.publicDir = path.join(this.rootDir, `public_${this.environment}`);

    this.loadEnvironmentVariables();
    this.initializeEditorIntegration();
  }

  initializeEditorIntegration() {
    const createEditorConfig = this.editorAdapter?.createEditorConfig;
    if (!createEditorConfig) {
      this.editorConfig = {
        enabled: false,
        routePrefix: '/__editor',
        buildTargetEnvironment: this.environment
      };
      return;
    }

    this.editorConfig = createEditorConfig({
      environment: this.environment,
      rootDir: this.rootDir
    });

    const BuildService = this.editorAdapter?.EditorBuildService;
    if (!BuildService) {
      return;
    }

    this.buildService = new BuildService({
      rootDir: this.rootDir,
      environment: this.editorConfig.buildTargetEnvironment
    });
  }

  loadEnvironmentVariables() {
    const envResult = loadEnvForEnvironment({
      rootDir: this.rootDir,
      environment: this.environment,
      logger: this.logger,
      requirePublic: false,
      apply: true,
      preserveExisting: true
    });

    const envFile = `.env.${this.environment}`;
    const envLocalFile = `.env.${this.environment}.local`;

    if (envResult.loadedFiles.includes(envFile)) {
      this.logger.verbose(`Loaded ${Object.keys(envResult.publicEnvVars).length} public variables from ${envFile}`);
    }

    if (envResult.loadedFiles.includes(envLocalFile)) {
      this.logger.verbose(`Loaded ${Object.keys(envResult.privateEnvVars).length} private variables from ${envLocalFile}`);
    }

    this.port = parseInt(process.env.PREVIEW_PORT || '', 10) || this.getDefaultPort();

    if (!this.port) {
      throw new Error(`No PREVIEW_PORT configured for environment: ${this.environment}`);
    }
  }

  getDefaultPort() {
    // Single default port for any environment; override per-run via PREVIEW_PORT.
    return 3001;
  }

  sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  }

  sendText(res, statusCode, content, mimeType = 'text/plain') {
    res.writeHead(statusCode, { 'Content-Type': mimeType });
    res.end(content);
  }

  async readJsonBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';

      req.on('data', (chunk) => {
        body += chunk.toString('utf8');
        if (body.length > 1024 * 1024 * 2) {
          reject(new Error('Request body too large'));
        }
      });

      req.on('end', () => {
        if (!body) {
          resolve({});
          return;
        }

        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error('Invalid JSON body'));
        }
      });

      req.on('error', reject);
    });
  }

  getEditorAssetPath(urlPath) {
    const assetName = urlPath.replace(`${this.editorConfig.routePrefix}/assets/`, '');
    return path.join(this.rootDir, 'lib', 'editor', 'static', assetName);
  }

  serveEditorFile(filePath, res) {
    if (!fs.existsSync(filePath)) {
      this.sendText(res, 404, 'Not Found');
      return;
    }

    this.serveFile(filePath, res);
  }

  async handleEditorApi(req, res, url) {
    if (!this.editorConfig.enabled || !this.editorAdapter) {
      this.sendJson(res, 404, { error: 'Editor disabled' });
      return true;
    }

    const {
      getPublicEditorConfig,
      editorSchemas,
      listPages,
      loadPage,
      savePage,
      createPage,
      deletePage
    } = this.editorAdapter;

    try {
      if (req.method === 'GET' && url.pathname === '/api/editor/config') {
        this.sendJson(res, 200, {
          config: getPublicEditorConfig(this.editorConfig)
        });
        return true;
      }

      if (req.method === 'GET' && url.pathname === '/api/editor/schemas') {
        this.sendJson(res, 200, {
          schemas: editorSchemas
        });
        return true;
      }

      if (req.method === 'GET' && url.pathname === '/api/editor/pages') {
        this.sendJson(res, 200, {
          pages: listPages(this.editorConfig)
        });
        return true;
      }

      if (req.method === 'POST' && url.pathname === '/api/editor/pages') {
        const payload = await this.readJsonBody(req);
        this.sendJson(res, 201, {
          page: createPage(this.editorConfig, payload)
        });
        return true;
      }

      if (req.method === 'GET' && url.pathname === '/api/editor/page') {
        const pageId = url.searchParams.get('id');
        if (!pageId) {
          this.sendJson(res, 400, { error: 'Missing page id' });
          return true;
        }

        this.sendJson(res, 200, {
          page: loadPage(this.editorConfig, pageId)
        });
        return true;
      }

      if (req.method === 'PUT' && url.pathname === '/api/editor/page') {
        const pageId = url.searchParams.get('id');
        if (!pageId) {
          this.sendJson(res, 400, { error: 'Missing page id' });
          return true;
        }

        const payload = await this.readJsonBody(req);
        if (!payload.page) {
          this.sendJson(res, 400, { error: 'Missing page payload' });
          return true;
        }

        this.sendJson(res, 200, {
          page: savePage(this.editorConfig, pageId, payload.page)
        });
        return true;
      }

      if (req.method === 'DELETE' && url.pathname === '/api/editor/page') {
        const pageId = url.searchParams.get('id');
        if (!pageId) {
          this.sendJson(res, 400, { error: 'Missing page id' });
          return true;
        }

        this.sendJson(res, 200, {
          deleted: deletePage(this.editorConfig, pageId)
        });
        return true;
      }

      if (req.method === 'POST' && url.pathname === '/api/editor/builds') {
        if (!this.buildService) {
          this.sendJson(res, 501, { error: 'Editor build service unavailable' });
          return true;
        }

        const payload = await this.readJsonBody(req);
        const result = this.buildService.startBuild(
          payload.environment || this.editorConfig.buildTargetEnvironment
        );

        this.sendJson(res, result.started ? 202 : 409, {
          started: result.started,
          job: result.job
        });
        return true;
      }

      if (req.method === 'GET' && url.pathname === '/api/editor/builds/latest') {
        this.sendJson(res, 200, {
          job: this.buildService?.getLatestJob?.() || null
        });
        return true;
      }
    } catch (error) {
      this.sendJson(res, 500, {
        error: error.message
      });
      return true;
    }

    return false;
  }

  async handleEditorRequest(req, res, url) {
    if (!this.editorConfig.enabled) {
      return false;
    }

    if (await this.handleEditorApi(req, res, url)) {
      return true;
    }

    if (req.method === 'GET' && url.pathname === this.editorConfig.routePrefix) {
      res.writeHead(302, { Location: `${this.editorConfig.routePrefix}/` });
      res.end();
      return true;
    }

    if (req.method === 'GET' && url.pathname === `${this.editorConfig.routePrefix}/`) {
      this.serveEditorFile(
        path.join(this.rootDir, 'lib', 'editor', 'static', 'index.html'),
        res
      );
      return true;
    }

    if (req.method === 'GET' && url.pathname.startsWith(`${this.editorConfig.routePrefix}/assets/`)) {
      const assetPath = this.getEditorAssetPath(url.pathname);
      if (!assetPath || assetPath.includes('..')) {
        this.sendText(res, 400, 'Bad Request');
        return true;
      }

      this.serveEditorFile(assetPath, res);
      return true;
    }

    return false;
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.ttf': 'font/ttf',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain'
    };

    return mimeTypes[ext] || 'text/plain';
  }

  serveFile(filePath, res) {
    const mimeType = this.getMimeType(filePath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
        return;
      }

      res.writeHead(200, {
        'Content-Type': mimeType,
        'Cache-Control': 'no-cache'
      });
      res.end(data);
    });
  }

  async handleRequest(req, res) {
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const indexPath = path.join(this.publicDir, 'index.html');

    if (
      this.editorConfig.enabled &&
      requestUrl.pathname === '/' &&
      !fs.existsSync(indexPath)
    ) {
      res.writeHead(302, { Location: `${this.editorConfig.routePrefix}/` });
      res.end();
      return;
    }

    if (await this.handleEditorRequest(req, res, requestUrl)) {
      return;
    }

    let urlPath = decodeURIComponent(requestUrl.pathname);

    if (urlPath.includes('..')) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h1>400 Bad Request</h1>');
      return;
    }

    if (urlPath === '/') {
      urlPath = '/index.html';
    }

    const filePath = path.join(this.publicDir, urlPath);

    fs.stat(filePath, (err, stats) => {
      if (err) {
        if (urlPath.endsWith('.html') || !path.extname(urlPath)) {
          const fallbackIndexPath = path.join(this.publicDir, 'index.html');
          fs.stat(fallbackIndexPath, (indexErr) => {
            if (indexErr) {
              res.writeHead(404, { 'Content-Type': 'text/html' });
              res.end('<h1>404 Not Found</h1>');
            } else {
              this.logger.verbose(`SPA fallback: ${req.url} -> /index.html`);
              this.serveFile(fallbackIndexPath, res);
            }
          });
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 Not Found</h1>');
        }
        return;
      }

      if (stats.isFile()) {
        this.logger.verbose(`Serving: ${req.url}`);
        this.serveFile(filePath, res);
        return;
      }

      const directoryIndexPath = path.join(filePath, 'index.html');
      fs.stat(directoryIndexPath, (indexErr) => {
        if (indexErr) {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 Not Found</h1>');
        } else {
          this.logger.verbose(`Directory index: ${req.url} -> index.html`);
          this.serveFile(directoryIndexPath, res);
        }
      });
    });
  }

  checkPublicDirectory() {
    if (!fs.existsSync(this.publicDir)) {
      throw new Error(`Public directory not found: ${this.publicDir}. Please build first with npm run build:${this.environment}`);
    }

    const indexFile = path.join(this.publicDir, 'index.html');
    if (!fs.existsSync(indexFile)) {
      this.logger.buildWarning('⚠️', `No index.html found in ${this.publicDir}`);
      this.logger.buildWarning('⚠️', 'The site may not work correctly');
    }
  }

  setupGracefulShutdown() {
    const gracefulShutdown = (signal) => {
      this.logger.info(`\n📡 Received ${signal}. Shutting down gracefully...`);

      if (this.server) {
        this.server.close(() => {
          this.logger.buildSuccess('✅', 'Preview server stopped');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  start() {
    this.logger.buildStart('Marbas Site Project - Preview Server');
    this.logger.info(`Environment: ${this.environment}`);
    this.logger.info(`Port: ${this.port}`);
    this.logger.info(`Serving: ${this.publicDir}`);
    this.logger.info(
      `Editor: ${this.editorConfig.enabled ? `enabled at ${this.editorConfig.routePrefix}` : 'disabled'}`
    );

    this.checkPublicDirectory();

    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    this.setupGracefulShutdown();

    this.server.listen(this.port, () => {
      this.logger.buildSuccess('✅', 'Preview server started');
      this.logger.info('');
      this.logger.info('🌐 Open your browser and navigate to:');
      this.logger.info(`   http://localhost:${this.port}`);
      if (this.editorConfig.enabled) {
        this.logger.info(`   http://localhost:${this.port}${this.editorConfig.routePrefix}`);
      }
      this.logger.info('');
      this.logger.info('📝 To stop the server, press Ctrl+C');
      this.logger.info('');
    });

    this.server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        this.logger.error('❌ Port is already in use');
        this.logger.error('Please choose a different port or stop the conflicting service');
      } else {
        this.logger.error(`❌ Server error: ${err.message}`);
      }
      process.exit(1);
    });

    return this.server;
  }
}

export function startPreviewServerFromCli({
  rootDir = process.cwd(),
  args = process.argv.slice(2),
  logger,
  editorAdapter
} = {}) {
  const safeLogger = withLogger(logger);

  if (args.length === 0) {
    safeLogger.error('❌ Environment is required!');
    safeLogger.error('Usage: node scripts/preview-server.js [environment]');
    safeLogger.error('');
    safeLogger.error('Available environments:');
    listEnvironments(rootDir).forEach((env) => {
      safeLogger.error(`  ✅ ${env}`);
    });
    process.exit(1);
  }

  const environment = args[0];

  process.on('unhandledRejection', (reason, promise) => {
    safeLogger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  process.on('uncaughtException', (error) => {
    safeLogger.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });

  const previewServer = new PreviewServer({
    rootDir,
    environment,
    logger: safeLogger,
    editorAdapter
  });

  previewServer.start();
  return previewServer;
}
