/**
 * Minimal argv parser — no external dependencies.
 *
 * Parses:
 *   marbas-site <command> [projectPath] [extra...] [--flag] [--flag=value]
 *
 * Returns:
 *   { command, projectPath, extras, flags }
 *
 * - command:     first positional (string | null)
 * - projectPath: second positional (string | null)
 * - extras:      remaining positionals after projectPath
 * - flags:       object of --flag → value (boolean true if no =value)
 */
export function parseArgv(argv) {
  const positionals = [];
  const flags = {};

  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const body = arg.slice(2);
      const eqIdx = body.indexOf('=');
      if (eqIdx === -1) {
        flags[body] = true;
      } else {
        flags[body.slice(0, eqIdx)] = body.slice(eqIdx + 1);
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      // short flags: -h, -v
      flags[arg.slice(1)] = true;
    } else {
      positionals.push(arg);
    }
  }

  const [command = null, projectPath = null, ...extras] = positionals;

  return { command, projectPath, extras, flags };
}
