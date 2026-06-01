/**
 * Command registry.
 * Each entry describes a CLI command and holds a run() function.
 */
import { initProject } from '../init/index.js';
import { runBuild } from './run/build.js';
import { runPreview } from './run/preview.js';
import { runDeploy } from './run/deploy.js';
import { runEject } from './run/eject.js';
import { runReset } from './run/reset.js';
import { runDoctorCommand } from './run/doctor.js';
import { runTheme } from './run/theme.js';
import { runEnvs } from './run/envs.js';

export const COMMANDS = [
  {
    name: 'init',
    description: 'Create a new Marbas project',
    usage: 'marbas-site init <path> [--name=<name>] [--env=<name>] [--force] [--starter]',
    positionals: ['path'],
    flags: ['--name=<name>', '--env=<name>', '--force', '--starter'],
    run({ projectPath, flags }) {
      if (!projectPath) {
        process.stderr.write('Usage: marbas-site init <path>\n');
        process.exit(1);
      }
      try {
        initProject({
          projectPath,
          name: flags.name || '',
          description: flags.description || '',
          defaultEnvironment: flags.env || 'development',
          force: Boolean(flags.force),
          starter: Boolean(flags.starter)
        });
        const mode = flags.starter ? 'starter project' : 'project';
        process.stdout.write(`Project initialised at ${projectPath} (${mode})\n`);
      } catch (err) {
        process.stderr.write(`${err.message}\n`);
        process.exit(1);
      }
    }
  },
  {
    name: 'build',
    description: 'Build the project for an environment',
    usage: 'marbas-site build <path> --env=<name>',
    positionals: ['path'],
    flags: ['--env=<name>', '--quiet'],
    run({ projectPath, flags }) {
      if (!projectPath) {
        process.stderr.write('Usage: marbas-site build <path> --env=<name>\n');
        process.exit(1);
      }
      runBuild({ projectPath, flags }).catch((err) => {
        process.stderr.write(`${err.message}\n`);
        process.exit(1);
      });
    }
  },
  {
    name: 'preview',
    description: 'Start the live-preview server',
    usage: 'marbas-site preview <path> --env=<name> [--port=<n>]',
    positionals: ['path'],
    flags: ['--env=<name>', '--port=<n>', '--quiet'],
    run({ projectPath, flags }) {
      if (!projectPath) {
        process.stderr.write('Usage: marbas-site preview <path> --env=<name>\n');
        process.exit(1);
      }
      runPreview({ projectPath, flags }).catch((err) => {
        process.stderr.write(`${err.message}\n`);
        process.exit(1);
      });
    }
  },
  {
    name: 'deploy',
    description: 'Deploy the built output to a target',
    usage: 'marbas-site deploy <path> --env=<name>',
    positionals: ['path'],
    flags: ['--env=<name>'],
    run({ projectPath, flags }) {
      if (!projectPath) {
        process.stderr.write('Usage: marbas-site deploy <path> --env=<name>\n');
        process.exit(1);
      }
      runDeploy({ projectPath, flags }).catch((err) => {
        process.stderr.write(`${err.message}\n`);
        process.exit(1);
      });
    }
  },
  {
    name: 'eject',
    description: 'Copy a lib file into the project for customisation',
    usage: 'marbas-site eject <path> <file> [--force]',
    positionals: ['path', 'file'],
    flags: ['--force'],
    run({ projectPath, extras, flags }) {
      const extraPath = extras[0];
      if (!projectPath || !extraPath) {
        process.stderr.write('Usage: marbas-site eject <path> <file>\n');
        process.exit(1);
      }
      runEject({ projectPath, extraPath, flags }).catch((err) => {
        process.stderr.write(`${err.message}\n`);
        process.exit(1);
      });
    }
  },
  {
    name: 'reset',
    description: 'Restore a previously ejected file to its lib default',
    usage: 'marbas-site reset <path> <file> [--force]',
    positionals: ['path', 'file'],
    flags: ['--force'],
    run({ projectPath, extras, flags }) {
      const extraPath = extras[0];
      if (!projectPath || !extraPath) {
        process.stderr.write('Usage: marbas-site reset <path> <file>\n');
        process.exit(1);
      }
      runReset({ projectPath, extraPath, flags }).catch((err) => {
        process.stderr.write(`${err.message}\n`);
        process.exit(1);
      });
    }
  },
  {
    name: 'doctor',
    description: 'Check project health and configuration',
    usage: 'marbas-site doctor <path> [--json] [--no-color]',
    positionals: ['path'],
    flags: ['--json', '--no-color'],
    run({ projectPath, flags }) {
      runDoctorCommand({ projectPath, flags });
    }
  },
  {
    name: 'theme',
    description: 'Set the active theme for a project',
    usage: 'marbas-site theme <path> <theme-id>',
    positionals: ['path', 'theme-id'],
    flags: [],
    run({ projectPath, extras }) {
      const themeId = extras[0];
      if (!projectPath || !themeId) {
        process.stderr.write('Usage: marbas-site theme <path> <theme-id>\n');
        process.exit(1);
      }
      runTheme({ projectPath, themeId });
    }
  },
  {
    name: 'envs',
    description: 'List available environments for a project',
    usage: 'marbas-site envs <path>',
    positionals: ['path'],
    flags: [],
    run({ projectPath }) {
      runEnvs({ projectPath });
    }
  }
];

export const COMMAND_MAP = Object.fromEntries(COMMANDS.map((c) => [c.name, c]));
