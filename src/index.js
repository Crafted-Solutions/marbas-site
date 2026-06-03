export { BuildHandler, runBuildFromCli } from './build/run-build.js';
export { PreviewServer, startPreviewServerFromCli } from './preview/start-preview.js';
export { SimpleFTPDeployer, runDeployFromCli } from './deploy/run-deploy.js';
export { loadEnvForEnvironment, parseEnvFile } from './config/load-env.js';
export { buildOutputDirForEnvironment, resolveBuildOutputPath as resolveOutputPath } from './env/output-paths.js';
export { buildEnvVars } from './env/build-env.js';
export { listEnvironments, isValidEnvironment, resolveEnvironment, getEnvironmentMode, BUILTIN_ENVIRONMENTS } from './env/resolve.js';
export { readProjectConfig, writeProjectConfig } from './project/config.js';
export { readSiteSettings, saveSiteSettings, normalizeSiteSettings, getDefaultSiteSettings, validateSiteSettings } from './site-settings/index.js';
export { resolveThemeFile, listLibraryThemes, getThemeDefaults, THEME_DEFAULTS_BY_ID, getCssMode, getActiveCssAssets, getVariantDefaultsForTheme, applyVariantDefaultsToSiteSettings } from './theme/index.js';
export { resolveHeaderConfig, resolveFooterConfig, resolveAnnouncementConfig, resolveActions, getHeaderPresetTemplate, getFooterPresetTemplate, VALID_HEADER_PRESETS, VALID_FOOTER_PRESETS } from './page/chrome/index.js';
export { listPages, loadPage, savePage, serializePageData, getPlaceholderEntries, parseFrontmatter, serializeFrontmatter, APP_ONLY_FRONTMATTER_KEYS, getManifestPath, readManifest, writeManifest, archiveVersionFile, normalizeTraits, extractClasses, extractVariantName, buildComponentYamlData, processComponent } from './page/index.js';

// High-Level API
export { build } from './build/build.js';
export { startPreview as preview } from './preview/orchestrator.js';
export { initProject as init } from './init/index.js';
export { eject } from './eject/index.js';
export { reset } from './reset/index.js';
export { runDoctor as doctor } from './doctor/index.js';

export async function deploy({ projectPath, environment, onLog } = {}) {
  const { SimpleFTPDeployer } = await import('./deploy/run-deploy.js');
  const { readProjectConfig } = await import('./project/config.js');
  const { resolveBuildOutputPath } = await import('./env/output-paths.js');
  const config = readProjectConfig(projectPath);
  const env = environment || config?.defaultEnvironment;
  const envConfig = config?.environments?.[env];
  const targetName = envConfig?.deployTarget;
  if (!targetName) throw new Error(`No deployTarget configured for environment "${env}"`);
  const target = config?.deployTargets?.[targetName];
  if (!target) throw new Error(`Deploy target "${targetName}" not found in marbas-project.json`);
  const outputPath = resolveBuildOutputPath({ projectPath, environment: env, config });
  const deployer = new SimpleFTPDeployer({ ...target, onLog });
  return deployer.deploy(outputPath);
}

export { registerCommand, registerAudit, registerWorkflow } from './plugin/registry.js';
