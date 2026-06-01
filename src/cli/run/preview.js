import path from 'path';
import { fileURLToPath } from 'url';
import { startPreview } from '../../preview/orchestrator.js';

const __filename = fileURLToPath(import.meta.url);
const LIB_ROOT = path.resolve(path.dirname(__filename), '../../..');

export async function runPreview({ projectPath, flags }) {
  const environment = flags.env || 'development';
  const port = flags.port ? parseInt(flags.port, 10) : 3001;
  const quiet = Boolean(flags.quiet);
  const absProject = path.resolve(projectPath);

  const onLog = quiet ? () => {} : (line) => process.stdout.write(line + '\n');

  try {
    const handle = await startPreview({
      projectRoot: absProject,
      environment,
      port,
      libRoot: LIB_ROOT,
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
