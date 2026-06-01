function normalizedFlagValue(value) {
  return String(value || '').trim().toLowerCase();
}

export function shouldBypassEleventyImageProcessing() {
  const forced = normalizedFlagValue(process.env.MARBAS_BYPASS_IMAGE_PIPELINE);
  if (forced) {
    return forced !== '0' && forced !== 'false' && forced !== 'no' && forced !== 'off';
  }

  return process.platform === 'linux' && process.arch === 'arm64';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function htmlAttribute(name, value) {
  if (value == null || value === '') {
    return '';
  }

  return ` ${name}="${escapeHtml(value)}"`;
}

export function createFallbackImageHtml({
  src,
  alt = '',
  sizes = '',
  className = '',
  loading = 'lazy',
  decoding = 'async'
}) {
  return `<img src="${escapeHtml(src)}"${htmlAttribute('alt', alt)}${htmlAttribute('sizes', sizes)}${htmlAttribute('class', className)}${htmlAttribute('loading', loading)}${htmlAttribute('decoding', decoding)}>`;
}
