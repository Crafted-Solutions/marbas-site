import path from 'path';
import { fileURLToPath } from 'url';
import { build } from '../../build/build.js';
import { createConsoleLogger } from '../../logger.js';

const __filename = fileURLToPath(import.meta.url);
const LIB_ROOT = path.resolve(path.dirname(__filename), '../../..');

export async function runBuild({ projectPath, flags }) {
  const environment = flags.env || 'development';
  const logLevel = flags.quiet ? 'silent' : (flags['log-level'] || 'normal');

  const logger = createConsoleLogger();
  logger.setLevel(logLevel);

  // Propagate to webpack child process (reads LOG_LEVEL at startup)
  process.env.LOG_LEVEL = logLevel;

  const onLog = (line) => { if (logger.shouldLog('minimal')) process.stdout.write(line + '\n'); };

  try {
    await build({ projectPath, environment, libRoot: LIB_ROOT, onLog });
  } catch (err) {
    process.stderr.write(`build failed: ${err.message}\n`);
    process.exit(1);
  }
}
