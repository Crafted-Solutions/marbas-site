/**
 * Minimal argv parser — no external dependencies.
 *
 * Parses:
 *   marbas-site <command> [projectPath] [extra...] [--flag] [--flag=value] [--flag value]
 *
 * Returns:
 *   { command, projectPath, extras, flags, errors }
 *
 * - command:     first positional (string | null)
 * - projectPath: second positional (string | null)
 * - extras:      remaining positionals after projectPath
 * - flags:       object of --flag → value (boolean true for switches)
 * - errors:      messages for value flags given without a value (caller aborts)
 *
 * Value flags (options.valueFlags) accept both `--name=value` and `--name value`. A value flag
 * without a value (last argument, or followed by another `--flag`) is an error instead of silently
 * becoming `true` (e.g. `init p --name` would otherwise name the project "true"). Flags that are not
 * declared as value flags keep the old behaviour: `--flag` → true, `--flag=value` → value.
 */
export function parseArgv(argv, { valueFlags = [] } = {}) {
  const positionals = [];
  const flags = {};
  const errors = [];
  const expectsValue = new Set(valueFlags);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const body = arg.slice(2);
      const eqIdx = body.indexOf('=');
      if (eqIdx !== -1) {
        flags[body.slice(0, eqIdx)] = body.slice(eqIdx + 1);
      } else if (expectsValue.has(body)) {
        const next = argv[i + 1];
        if (next === undefined || next.startsWith('-')) {
          errors.push(`--${body} expects a value: --${body}=<value> or --${body} <value>`);
        } else {
          flags[body] = next;
          i++;
        }
      } else {
        flags[body] = true;
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      // short flags: -h, -v
      flags[arg.slice(1)] = true;
    } else {
      positionals.push(arg);
    }
  }

  const [command = null, projectPath = null, ...extras] = positionals;

  return { command, projectPath, extras, flags, errors };
}

/**
 * Value flag names from command definitions: every `flags` entry of the form `--name=<…>`.
 * @param {Array<{ flags?: string[] }>} commands
 * @returns {string[]}
 */
export function collectValueFlags(commands) {
  const names = new Set();
  for (const cmd of commands) {
    for (const flag of cmd.flags || []) {
      const match = /^--([\w-]+)=/.exec(flag);
      if (match) names.add(match[1]);
    }
  }
  return [...names];
}
