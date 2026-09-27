import { test } from 'node:test';
import assert from 'node:assert/strict';
import { socialIcon, SOCIAL_PLATFORMS } from '../../src/render/filters/social-icons.js';

test('every documented platform has its own icon', () => {
  const documented = ['x', 'instagram', 'linkedin', 'github', 'facebook', 'youtube', 'tiktok', 'xing'];
  assert.deepEqual([...SOCIAL_PLATFORMS].sort(), [...documented].sort());
  const fallback = socialIcon('unknown-platform');
  for (const platform of documented) {
    const svg = socialIcon(platform);
    assert.match(svg, /^<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="[^"]+"\/><\/svg>$/);
    assert.notEqual(svg, fallback, `${platform} has a real icon`);
  }
});

test('twitter is an alias for x; platform keys are case-insensitive', () => {
  assert.equal(socialIcon('twitter'), socialIcon('x'));
  assert.equal(socialIcon(' Instagram '), socialIcon('instagram'));
});

test('unknown or missing platform falls back to a neutral icon', () => {
  assert.match(socialIcon('mastodon'), /<svg/);
  assert.equal(socialIcon(undefined), socialIcon('mastodon'));
});
