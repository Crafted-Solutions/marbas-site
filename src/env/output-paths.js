import path from 'path';

// Any environment maps to public_<env>. Detects a build dir that already points
// at a concrete public_<env> directory (legacy configs) for backward compat.
const LEGACY_OUTPUT_DIR_PATTERN = /^public_[a-z0-9_]+$/;

export function buildOutputDirForEnvironment(environment) {
  const normalized = String(environment || '').trim().toLowerCase();
  return /^[a-z0-9_]+$/.test(normalized) ? `public_${normalized}` : '';
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
