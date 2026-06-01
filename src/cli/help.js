import { COMMANDS, COMMAND_MAP } from './commands.js';

const COL_NAME = 10;
const COL_USAGE = 36;

function pad(str, len) {
  return str.length >= len ? str + '  ' : str + ' '.repeat(len - str.length);
}

export function printGlobalHelp(version) {
  const lines = [
    `marbas-site v${version}`,
    '',
    'Usage:',
    '  marbas-site <command> [path] [options]',
    '',
    'Commands:'
  ];

  for (const cmd of COMMANDS) {
    lines.push(`  ${pad(cmd.name, COL_NAME)}${cmd.description}`);
  }

  lines.push('', 'Options:');
  lines.push('  --help      Show help for a command');
  lines.push('  --version   Print version and exit');
  lines.push('');
  lines.push('Run `marbas-site <command> --help` for command-specific options.');
  lines.push('');

  process.stdout.write(lines.join('\n'));
}

export function printCommandHelp(commandName) {
  const cmd = COMMAND_MAP[commandName];
  if (!cmd) {
    process.stderr.write(`Unknown command: ${commandName}\n`);
    process.exit(1);
  }

  const lines = [
    `marbas-site ${cmd.name}`,
    '',
    `  ${cmd.description}`,
    '',
    'Usage:',
    `  ${cmd.usage}`,
  ];

  if (cmd.flags.length > 0) {
    lines.push('', 'Options:');
    for (const flag of cmd.flags) {
      lines.push(`  ${flag}`);
    }
  }

  lines.push('');
  process.stdout.write(lines.join('\n'));
}
