import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { runComponentBuildHooks } from '../../src/component/build-hooks.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-hooks-'));
}

function makeProjectWithHook(projectRoot, name, hookBody) {
  const compDir = path.join(projectRoot, '_components', name);
  fs.mkdirSync(compDir, { recursive: true });
  fs.writeFileSync(path.join(compDir, 'build.js'), hookBody);
  return compDir;
}

test('runComponentBuildHooks — no hooks → resolves immediately', async () => {
  const tmp = makeTmpDir();
  fs.mkdirSync(path.join(tmp, '_components'), { recursive: true });

  await assert.doesNotReject(() =>
    runComponentBuildHooks({ projectRoot: tmp, environment: 'development', outputPath: tmp, libRoot: tmp })
  );

  fs.rmSync(tmp, { recursive: true });
});

test('runComponentBuildHooks — hook called with correct context', async () => {
  const tmp = makeTmpDir();
  const received = {};
  const hookFile = path.join(tmp, 'hook-spy.mjs');

  // Write hook that writes context to a JSON file
  const contextFile = path.join(tmp, 'context.json');
  fs.writeFileSync(hookFile, `
import fs from 'fs';
export default async function(ctx) {
  fs.writeFileSync(${JSON.stringify(contextFile)}, JSON.stringify(ctx));
}
`);

  const compDir = path.join(tmp, '_components', 'MyComp');
  fs.mkdirSync(compDir, { recursive: true });
  fs.copyFileSync(hookFile, path.join(compDir, 'build.js'));

  await runComponentBuildHooks({
    projectRoot: tmp,
    environment: 'development',
    outputPath: '/fake/output',
    libRoot: tmp,
    log: () => {}
  });

  const ctx = JSON.parse(fs.readFileSync(contextFile, 'utf8'));
  assert.equal(ctx.environment, 'development');
  assert.equal(ctx.outputPath, '/fake/output');
  assert.equal(ctx.projectRoot, tmp);
  assert.ok(ctx.componentDir.includes('MyComp'));

  fs.rmSync(tmp, { recursive: true });
});

test('runComponentBuildHooks — hook error throws with component name', async () => {
  const tmp = makeTmpDir();
  const compDir = path.join(tmp, '_components', 'Broken');
  fs.mkdirSync(compDir, { recursive: true });
  fs.writeFileSync(path.join(compDir, 'build.js'), `
export default async function() {
  throw new Error('intentional hook failure');
}
`);

  await assert.rejects(
    () => runComponentBuildHooks({ projectRoot: tmp, environment: 'development', outputPath: tmp, libRoot: tmp }),
    (err) => {
      assert.ok(err.message.includes('Broken'), `Expected "Broken" in: ${err.message}`);
      assert.ok(err.message.includes('intentional hook failure'));
      return true;
    }
  );

  fs.rmSync(tmp, { recursive: true });
});

test('runComponentBuildHooks — non-function default export throws', async () => {
  const tmp = makeTmpDir();
  const compDir = path.join(tmp, '_components', 'BadExport');
  fs.mkdirSync(compDir, { recursive: true });
  fs.writeFileSync(path.join(compDir, 'build.js'), `export default 42;`);

  await assert.rejects(
    () => runComponentBuildHooks({ projectRoot: tmp, environment: 'development', outputPath: tmp, libRoot: tmp }),
    (err) => {
      assert.ok(err.message.includes('default function'), `Expected "default function" in: ${err.message}`);
      return true;
    }
  );

  fs.rmSync(tmp, { recursive: true });
});
