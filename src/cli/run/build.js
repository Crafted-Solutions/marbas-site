import path from 'path';
import { fileURLToPath } from 'url';
import { build } from '../../build/build.js';

const __filename = fileURLToPath(import.meta.url);
const LIB_ROOT = path.resolve(path.dirname(__filename), '../../..');

export async function runBuild({ projectPath, flags }) {
  const environment = flags.env || 'development';
  const quiet = Boolean(flags.quiet);

  const onLog = quiet ? () => {} : (line) => process.stdout.write(line + '\n');

  try {
    await build({ projectPath, environment, libRoot: LIB_ROOT, onLog });
  } catch (err) {
    process.stderr.write(`build failed: ${err.message}\n`);
    process.exit(1);
  }
}
