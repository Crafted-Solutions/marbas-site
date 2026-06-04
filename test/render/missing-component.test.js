import test from 'node:test';
import assert from 'node:assert/strict';
import { registerMissingComponentShortcode } from '../../src/render/shortcodes/missing-component.js';

/**
 * Captures the shortcode registered by registerMissingComponentShortcode so it
 * can be invoked directly. Silences console.warn to keep test output clean.
 */
function buildShortcode() {
  let fn = null;
  const eleventyConfig = {
    addShortcode(name, callback) {
      if (name === 'renderMissingComponent') fn = callback;
    }
  };
  registerMissingComponentShortcode(eleventyConfig);
  assert.ok(typeof fn === 'function', 'renderMissingComponent shortcode must be registered');
  return fn;
}

const origWarn = console.warn;
function silenceWarn(run) {
  console.warn = () => {};
  try { return run(); } finally { console.warn = origWarn; }
}

test('renders placeholder HTML in development', () => {
  const render = buildShortcode();
  const html = silenceWarn(() => render('HeroBanner', 'Placeholder_Main', 'index.md', 'development'));
  assert.match(html, /c-missing-component/);
  assert.match(html, /data-missing-component="HeroBanner"/);
  assert.match(html, /Fehlende Komponente: HeroBanner/);
});

test('renders empty string outside development', () => {
  const render = buildShortcode();
  const html = silenceWarn(() => render('HeroBanner', 'Placeholder_Main', 'index.md', 'production'));
  assert.equal(html, '');
});

test('escapes the component type in the output', () => {
  const render = buildShortcode();
  const html = silenceWarn(() => render('<x>"&', '', '', 'development'));
  assert.match(html, /data-missing-component="&lt;x&gt;&quot;&amp;"/);
  assert.ok(!html.includes('<x>'), 'raw component type must not appear unescaped');
});

test('falls back to UnknownComponent for empty type', () => {
  const render = buildShortcode();
  const html = silenceWarn(() => render('', '', '', 'development'));
  assert.match(html, /data-missing-component="UnknownComponent"/);
});

test('warns only once per unique key', () => {
  const render = buildShortcode();
  const calls = [];
  console.warn = (msg) => calls.push(msg);
  try {
    render('HeroBanner', 'Placeholder_Main', 'index.md', 'development');
    render('HeroBanner', 'Placeholder_Main', 'index.md', 'development');
    render('HeroBanner', 'Placeholder_Main', 'about.md', 'development');
  } finally {
    console.warn = origWarn;
  }
  assert.equal(calls.length, 2, 'same key warns once; different page warns again');
});
