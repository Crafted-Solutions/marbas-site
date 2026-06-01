import fs from 'fs';
import path from 'path';

/**
 * @param {{ projectPath: string, siteSettings?: object }} opts
 * @returns {Array<{ id: string, status: 'ok'|'warn'|'error', message: string, details?: string }>}
 */
export function checkCssMode({ projectPath, siteSettings = null }) {
  const absProject = path.resolve(projectPath);

  let settings = siteSettings;
  if (!settings) {
    // Try reading site.json from pages/_data/site.json or _data/site.json
    for (const candidate of [
      path.join(absProject, 'pages', '_data', 'site.json'),
      path.join(absProject, '_data', 'site.json'),
    ]) {
      if (fs.existsSync(candidate)) {
        try {
          settings = JSON.parse(fs.readFileSync(candidate, 'utf8'));
        } catch {
          // ignore parse error, treat as no settings
        }
        break;
      }
    }
  }

  const cssMode = String(settings?.theme?.cssMode || settings?.cssMode || 'marbas').trim().toLowerCase();

  if (cssMode !== 'external') {
    return [{ id: 'css-mode', status: 'ok', message: `cssMode: ${cssMode}` }];
  }

  const results = [{ id: 'css-mode', status: 'ok', message: 'cssMode: external' }];

  const layoutsDir = path.join(absProject, '_layouts');
  const hasEjectedLayout = fs.existsSync(layoutsDir) &&
    fs.readdirSync(layoutsDir).some((f) => !f.startsWith('.'));

  if (!hasEjectedLayout) {
    results.push({
      id: 'css-mode.layouts',
      status: 'warn',
      message: 'cssMode: external active but no layouts ejected',
      details: 'Default layouts depend on Marbas CSS classes. Eject a layout and adapt it to your framework.',
    });
  } else {
    results.push({ id: 'css-mode.layouts', status: 'ok', message: 'Layout ejected for external CSS mode' });
  }

  return results;
}
