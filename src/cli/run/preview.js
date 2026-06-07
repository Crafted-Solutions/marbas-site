import path from 'path';
import { fileURLToPath } from 'url';
import { startPreview } from '../../preview/orchestrator.js';
import { readProjectConfig } from '../../project/config.js';
import { buildEnvVars } from '../../env/build-env.js';
import { createConsoleLogger } from '../../logger.js';

const __filename = fileURLToPath(import.meta.url);
const LIB_ROOT = path.resolve(path.dirname(__filename), '../../..');

export async function runPreview({ projectPath, flags }) {
  const environment = flags.env || 'development';
  const port = flags.port ? parseInt(flags.port, 10) : 3001;
  const logLevel = flags.quiet ? 'silent' : (flags['log-level'] || 'normal');
  const absProject = path.resolve(projectPath);

  const logger = createConsoleLogger();
  logger.setLevel(logLevel);
  process.env.LOG_LEVEL = logLevel;

  const onLog = (line) => { if (logger.shouldLog('minimal')) process.stdout.write(line + '\n'); };

  let extraEnv = {};
  try {
    const config = readProjectConfig(absProject);
    extraEnv = buildEnvVars({ projectPath: absProject, environment, config });
  } catch {
    // marbas-project.json absent — preview starts with defaults
  }

  try {
    const handle = await startPreview({
      projectRoot: absProject,
      environment,
      port,
      libRoot: LIB_ROOT,
      extraEnv,
      onLog
    });

    process.stdout.write(`preview ready at http://localhost:${handle.port}/\n`);

    // Keep alive until SIGINT
    process.on('SIGINT', () => {
      handle.stop();
      process.exit(0);
    });
  } catch (err) {
    process.stderr.write(`preview failed: ${err.message}\n`);
    process.exit(1);
  }
}
