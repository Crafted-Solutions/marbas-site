import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const includesRoot = path.resolve(__dirname, '../../../_includes');

export const VALID_HEADER_PRESETS = Object.freeze(['brand-nav', 'brand-nav-actions', 'utility-brand-nav', 'centered-nav']);
export const VALID_FOOTER_PRESETS = Object.freeze(['simple', 'columns', 'columns-social', 'columns-cta', 'editorial']);

export function getHeaderPresetTemplate(presetName) {
  const name = String(presetName || '').trim();
  if (!VALID_HEADER_PRESETS.includes(name)) {
    throw new Error(`Unknown header preset: "${name}". Valid presets: ${VALID_HEADER_PRESETS.join(', ')}`);
  }

  return path.join(includesRoot, 'header', 'presets', `${name}.njk`);
}

export function getFooterPresetTemplate(presetName) {
  const name = String(presetName || '').trim();
  if (!VALID_FOOTER_PRESETS.includes(name)) {
    throw new Error(`Unknown footer preset: "${name}". Valid presets: ${VALID_FOOTER_PRESETS.join(', ')}`);
  }

  return path.join(includesRoot, 'footer', 'presets', `${name}.njk`);
}
