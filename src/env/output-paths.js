import path from 'path';

const OUTPUT_DIR_BY_ENVIRONMENT = {
  development: 'public_development',
  local_test: 'public_local_test',
  staging: 'public_staging',
  production: 'public_production'
};

const LEGACY_OUTPUT_DIR_PATTERN = /^public_(development|local_test|staging|production)$/;

export function buildOutputDirForEnvironment(environment) {
  const normalized = String(environment || '').trim().toLowerCase();

  if (normalized === 'develop') {
    return OUTPUT_DIR_BY_ENVIRONMENT.development;
  }

  if (normalized === 'test-local') {
    return OUTPUT_DIR_BY_ENVIRONMENT.local_test;
  }

  if (normalized === 'produktion') {
    return OUTPUT_DIR_BY_ENVIRONMENT.production;
  }

  return OUTPUT_DIR_BY_ENVIRONMENT[normalized] || (/^[a-z0-9_]+$/.test(normalized) ? `public_${normalized}` : '');
}

function normalizeConfiguredBuildDir(configuredBuildDir) {
  const value = String(configuredBuildDir || '').trim();
  return value || './build';
}

export function resolveBuildOutputPath({ projectRoot, config, environment }) {
  const outputDir = buildOutputDirForEnvironment(environment);
  if (!outputDir) {
    return '';
  }

  const configuredBuildDir = normalizeConfiguredBuildDir(config?.paths?.buildDir);
  const absoluteConfiguredBuildDir = path.resolve(projectRoot, configuredBuildDir);
  const configuredBaseName = path.basename(absoluteConfiguredBuildDir);

  // Backward compatibility: old configs stored a concrete public_* directory.
  if (LEGACY_OUTPUT_DIR_PATTERN.test(configuredBaseName)) {
    return path.join(path.dirname(absoluteConfiguredBuildDir), outputDir);
  }

  return path.join(absoluteConfiguredBuildDir, outputDir);
}
