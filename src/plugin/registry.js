let _currentSource = null;
const _commands = [];
const _audits = [];
const _workflows = [];
const _extensions = [];

export function _setCurrentSource(source) {
  _currentSource = source;
}

export function _registerExtension({ name, version }) {
  _extensions.push({ name, version });
}

export function registerCommand({ name, description, run }) {
  const existing = _commands.find((c) => c.name === name);
  if (existing) {
    throw new Error(
      `Duplicate command "${name}": already registered by "${existing._plugin}", conflict with "${_currentSource}"`
    );
  }
  _commands.push({ name, description, run, _plugin: _currentSource });
}

export function registerAudit({ name, run }) {
  const existing = _audits.find((a) => a.name === name);
  if (existing) {
    throw new Error(
      `Duplicate audit "${name}": already registered by "${existing._plugin}", conflict with "${_currentSource}"`
    );
  }
  _audits.push({ name, run, _plugin: _currentSource });
}

export function registerWorkflow({ name, steps }) {
  const existing = _workflows.find((w) => w.name === name);
  if (existing) {
    throw new Error(
      `Duplicate workflow "${name}": already registered by "${existing._plugin}", conflict with "${_currentSource}"`
    );
  }
  _workflows.push({ name, steps, _plugin: _currentSource });
}

export function listExtensions() {
  return [..._extensions];
}

export function listCommands() {
  return [..._commands];
}

export function listAudits() {
  return [..._audits];
}

export function listWorkflows() {
  return [..._workflows];
}

export function _reset() {
  _commands.length = 0;
  _audits.length = 0;
  _workflows.length = 0;
  _extensions.length = 0;
  _currentSource = null;
}
