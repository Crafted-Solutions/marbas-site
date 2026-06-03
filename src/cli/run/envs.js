import { listEnvironments } from '../../env/resolve.js';

export function runEnvs({ projectPath }) {
  if (!projectPath) {
    process.stderr.write('Usage: marbas-site envs <path>\n');
    process.exit(1);
  }

  let environments;
  try {
    environments = listEnvironments(projectPath);
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  }

  if (!environments.length) {
    process.stdout.write('No environments configured.\n');
    return;
  }

  for (const name of environments) {
    process.stdout.write(`${name}\n`);
  }
}
