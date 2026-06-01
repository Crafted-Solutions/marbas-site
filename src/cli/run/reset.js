import readline from 'readline';
import { reset } from '../../reset/index.js';

function confirm(question) {
  if (!process.stdin.isTTY) {
    process.stdout.write(`[non-TTY] auto-confirming: ${question}\n`);
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`${question} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

export async function runReset({ projectPath, extraPath, flags }) {
  const relativePath = extraPath;
  if (!projectPath || !relativePath) {
    process.stderr.write('Usage: marbas-site reset <path> <file>\n');
    process.exit(1);
  }

  const force = Boolean(flags.force);
  if (!force) {
    const ok = await confirm(`Reset "${relativePath}" to lib default? A backup will be saved.`);
    if (!ok) {
      process.stdout.write('Aborted.\n');
      process.exit(0);
    }
  }

  const result = reset({ projectPath, relativePath });

  if (result.status === 'error') {
    process.stderr.write(`${result.message}\n`);
    process.exit(1);
  }

  process.stdout.write(`${result.message}\n`);
}
