// prepareBuildContext and cleanupBuildContext are no-ops since Phase 9 (Task 60).
// The symlink workspace (.marbas/build-context/) is no longer created.
// Templates are resolved via MarbasResolver, addLayoutAlias, and shortcodes.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { prepareBuildContext, cleanupBuildContext } from '../../src/build/prepare-context.js';

describe('prepareBuildContext (deprecated no-op since Phase 9)', () => {
  it('can be called without arguments', () => {
    assert.doesNotThrow(() => prepareBuildContext());
  });

  it('accepts legacy {projectPath, libRoot} signature without error', () => {
    assert.doesNotThrow(() => prepareBuildContext({ projectPath: '/tmp', libRoot: '/tmp' }));
  });

  it('does not create a .marbas/build-context/ directory', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-ctx-noop-'));
    try {
      prepareBuildContext({ projectPath: tmp, libRoot: tmp });
      assert.ok(
        !fs.existsSync(path.join(tmp, '.marbas', 'build-context')),
        'build-context directory must not be created'
      );
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('cleanupBuildContext (deprecated no-op since Phase 9)', () => {
  it('can be called without arguments', () => {
    assert.doesNotThrow(() => cleanupBuildContext());
  });

  it('accepts a projectPath argument without error', () => {
    assert.doesNotThrow(() => cleanupBuildContext('/tmp'));
  });

  it('is safe when .marbas/build-context/ does not exist', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-ctx-noop-'));
    try {
      assert.doesNotThrow(() => cleanupBuildContext(tmp));
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
