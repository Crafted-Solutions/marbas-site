import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { buildOutputDirForEnvironment, resolveBuildOutputPath } from '../../src/env/output-paths.js';

describe('buildOutputDirForEnvironment', () => {
  it('returns public_development for "development"', () => {
    assert.equal(buildOutputDirForEnvironment('development'), 'public_development');
  });

  it('returns public_development for alias "develop"', () => {
    assert.equal(buildOutputDirForEnvironment('develop'), 'public_development');
  });

  it('returns public_staging for "staging"', () => {
    assert.equal(buildOutputDirForEnvironment('staging'), 'public_staging');
  });

  it('returns public_production for "production"', () => {
    assert.equal(buildOutputDirForEnvironment('production'), 'public_production');
  });

  it('returns public_production for alias "produktion"', () => {
    assert.equal(buildOutputDirForEnvironment('produktion'), 'public_production');
  });

  it('returns public_local_test for "local_test"', () => {
    assert.equal(buildOutputDirForEnvironment('local_test'), 'public_local_test');
  });

  it('returns public_local_test for alias "test-local"', () => {
    assert.equal(buildOutputDirForEnvironment('test-local'), 'public_local_test');
  });

  it('returns public_<name> for a custom env name', () => {
    assert.equal(buildOutputDirForEnvironment('custom_env'), 'public_custom_env');
  });

  it('returns empty string for invalid name with special chars', () => {
    assert.equal(buildOutputDirForEnvironment('my env!'), '');
  });

  it('returns empty string for empty input', () => {
    assert.equal(buildOutputDirForEnvironment(''), '');
  });

  it('handles uppercase by normalizing to lowercase', () => {
    assert.equal(buildOutputDirForEnvironment('DEVELOPMENT'), 'public_development');
  });
});

describe('resolveBuildOutputPath', () => {
  const root = '/project';

  it('resolves standard build dir + environment', () => {
    const result = resolveBuildOutputPath({
      projectRoot: root,
      config: { paths: { buildDir: './build' } },
      environment: 'staging'
    });
    assert.equal(result, path.join(root, 'build', 'public_staging'));
  });

  it('uses ./build as default when buildDir is missing', () => {
    const result = resolveBuildOutputPath({
      projectRoot: root,
      config: {},
      environment: 'production'
    });
    assert.equal(result, path.join(root, 'build', 'public_production'));
  });

  it('returns empty string for invalid environment', () => {
    const result = resolveBuildOutputPath({
      projectRoot: root,
      config: { paths: { buildDir: './build' } },
      environment: 'bad env!'
    });
    assert.equal(result, '');
  });

  it('handles legacy buildDir (public_*) with backward-compat redirect', () => {
    const result = resolveBuildOutputPath({
      projectRoot: root,
      config: { paths: { buildDir: './public_development' } },
      environment: 'staging'
    });
    assert.equal(result, path.join(root, 'public_staging'));
  });

  it('resolves absolute buildDir', () => {
    const result = resolveBuildOutputPath({
      projectRoot: root,
      config: { paths: { buildDir: '/absolute/build' } },
      environment: 'development'
    });
    assert.equal(result, path.join('/absolute/build', 'public_development'));
  });
});
