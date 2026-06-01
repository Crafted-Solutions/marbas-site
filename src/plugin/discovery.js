import fs from 'fs';
import path from 'path';
import { _setCurrentSource, _registerExtension, registerCommand, registerAudit, registerWorkflow } from './registry.js';

export async function discoverPlugins({ projectPath }) {
  const nmDir = path.join(projectPath, 'node_modules');
  if (!fs.existsSync(nmDir)) return;

  const scopedDir = path.join(nmDir, '@marbas');
  if (fs.existsSync(scopedDir)) {
    let entries;
    try { entries = fs.readdirSync(scopedDir); } catch { entries = []; }
    for (const name of entries) {
      await _tryLoad(path.join(scopedDir, name), `@marbas/${name}`);
    }
  }

  let topLevel;
  try { topLevel = fs.readdirSync(nmDir); } catch { return; }
  for (const name of topLevel) {
    if (name.startsWith('marbas-')) {
      await _tryLoad(path.join(nmDir, name), name);
    }
  }
}

async function _tryLoad(pkgDir, pkgName) {
  const pkgJsonPath = path.join(pkgDir, 'package.json');
  let pkgJson;
  try {
    pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  } catch {
    return;
  }

  if (!pkgJson['marbas-extension']) return;

  const main = pkgJson.main || 'index.js';
  const entryPath = path.join(pkgDir, main);

  try {
    _setCurrentSource(pkgName);
    const mod = await import(entryPath);
    if (typeof mod.extensionEntry === 'function') {
      await mod.extensionEntry({ registerCommand, registerAudit, registerWorkflow });
    }
    _registerExtension({ name: pkgName, version: pkgJson.version || '0.0.0' });
  } catch (err) {
    process.stderr.write(`Warning: failed to load plugin "${pkgName}": ${err.message}\n`);
  } finally {
    _setCurrentSource(null);
  }
}
