#!/usr/bin/env node
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { parseArgv } from './argv.js';
import { COMMANDS, COMMAND_MAP } from './commands.js';
import { printGlobalHelp, printCommandHelp } from './help.js';
import { discoverPlugins } from '../plugin/discovery.js';
import { listCommands } from '../plugin/registry.js';
import { getLibRoot } from '../eject/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));

await discoverPlugins({ libRoot: getLibRoot(), projectPath: process.cwd() });

for (const cmd of listCommands()) {
  if (COMMAND_MAP[cmd.name]) {
    process.stderr.write(`Warning: plugin "${cmd._plugin}" tried to register command "${cmd.name}" which already exists — skipped\n`);
    continue;
  }
  const pluginCmd = { ...cmd, description: `${cmd.description} [${cmd._plugin}]` };
  COMMANDS.push(pluginCmd);
  COMMAND_MAP[pluginCmd.name] = pluginCmd;
}

const { command, projectPath, extras, flags } = parseArgv(process.argv.slice(2));

if (flags.version || flags.v) {
  process.stdout.write(pkg.version + '\n');
  process.exit(0);
}

if (!command || flags.help || flags.h) {
  if (command && COMMAND_MAP[command]) {
    printCommandHelp(command);
  } else {
    printGlobalHelp(pkg.version);
  }
  process.exit(0);
}

const cmd = COMMAND_MAP[command];
if (!cmd) {
  process.stderr.write(`Unknown command: ${command}\nRun marbas-site --help for usage.\n`);
  process.exit(1);
}

if (flags.help || flags.h) {
  printCommandHelp(command);
  process.exit(0);
}

cmd.run({ command, projectPath, extras, flags }, {});
