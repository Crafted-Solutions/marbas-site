import fs from 'fs';
import path from 'path';
import { readProjectConfig, writeProjectConfig } from '../../project/config.js';
import { resolveThemeFile } from '../../theme/resolver.js';
import { getLibRoot } from '../../eject/index.js';
import { applyVariantDefaultsToSiteSettings } from '../../theme/variant-defaults.js';
import { readSiteSettings } from '../../site-settings/io.js';

const LIB_ROOT = getLibRoot();

export function runTheme({ projectPath, themeId, libRoot = LIB_ROOT }) {
  if (!projectPath || !themeId) {
    process.stderr.write('Usage: marbas-site theme <path> <theme-id>\n');
    process.exit(1);
  }

  const absProject = path.resolve(projectPath);

  let config;
  try {
    config = readProjectConfig(absProject);
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  }

  try {
    resolveThemeFile({ projectPath: absProject, themeId, libRoot });
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  }

  config.theme = { ...config.theme, id: themeId };
  writeProjectConfig(absProject, config);

  // Like the CMS editor: apply the theme's header/nav/footer variants where the site still uses "default".
  let variantNote = '';
  // Only the three variant fields are touched in the raw file — no normalization, so omitted
  // sections are not filled with (German) defaults and the file keeps its shape.
  const { filePath } = readSiteSettings(absProject, config) || {};
  if (filePath && fs.existsSync(filePath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const updated = applyVariantDefaultsToSiteSettings(raw, themeId);
      const changed = [
        ['header.variant', raw.header?.variant, updated.header.variant],
        ['header.navigationVariant', raw.header?.navigationVariant, updated.header.navigationVariant],
        ['footer.variant', raw.footer?.variant, updated.footer.variant]
      ].filter(([, before, after]) => before !== after);
      if (changed.length) {
        fs.writeFileSync(filePath, JSON.stringify(updated, null, 2) + '\n');
        variantNote = ` Variants: ${changed.map(([key, , after]) => `${key}=${after}`).join(', ')}.`;
      }
    } catch (err) {
      process.stderr.write(`Could not update site.json variants: ${err.message}\n`);
    }
  }
  process.stdout.write(`Theme set to ${themeId}.${variantNote} Run "marbas-site build" to apply.\n`);
}
