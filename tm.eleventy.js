import fs from 'fs';
import path from 'path';
import { EleventyRenderPlugin, EleventyHtmlBasePlugin } from '@11ty/eleventy';
import eleventyNavigationPlugin from '@11ty/eleventy-navigation';
import metagen from 'eleventy-plugin-metagen';
import { addLibAssetsPassthrough, addComponentApiPassthrough } from './src/eleventy/passthrough.js';
import { registerWithEleventy, configureLocaleFilters } from './src/render/index.js';
import { readProjectConfig } from './src/project/config.js';
import { resolveBuildOutputPath } from './src/env/output-paths.js';
import { readSiteSettings } from './src/site-settings/io.js';
import { getLibRoot } from './src/eject/index.js';
import { resolveComponentPath } from './src/components/resolver.js';
import { MarbasResolver } from './src/render/nunjucks-resolver.js';
import { registerLayoutAliases } from './src/render/layout-aliases.js';

const LIB_ROOT = getLibRoot();

export default function (eleventyConfig) {
  const projectRoot = process.cwd();
  const environment = process.env.MARBAS_PUBLISH_ENVIRONMENT || 'development';

  eleventyConfig.addPlugin(EleventyRenderPlugin);
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(metagen);
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  // Read the project config once and derive everything (locale, output) from it.
  let projectConfig = null;
  let configOk = false;
  try {
    projectConfig = readProjectConfig(projectRoot);
    configOk = true;
  } catch { /* marbas-project.json absent — use defaults below */ }

  // Resolve the build output once. publishFolder feeds image processing,
  // outputDir feeds Eleventy's dir.output — both derive from the same path.
  let outputDir = path.join(projectRoot, 'build', `public_${environment}`);
  let publishFolder = '';
  if (configOk) {
    try {
      const absOutput = resolveBuildOutputPath({ projectRoot, config: projectConfig, environment });
      outputDir = absOutput;
      publishFolder = path.relative(projectRoot, absOutput);
    } catch { /* keep fallbacks — images land in ./images/, output in build/public_<env> */ }
  }

  // Read locale config from site.json; fall back to single-language default.
  let localeConfig = null;
  if (configOk) {
    try {
      const siteSettings = readSiteSettings(projectRoot, projectConfig);
      if (siteSettings?.locale?.languages?.length) {
        localeConfig = siteSettings.locale;
      }
    } catch { /* ignore — locale is optional */ }
  }
  if (!localeConfig) {
    localeConfig = { defaultLanguage: 'de', languages: [{ code: 'de', label: 'Deutsch' }] };
  }

  registerWithEleventy(eleventyConfig, { publishFolder, domain: '', localeConfig });

  // Absolute path to lib _includes/ — used by renderFile shortcodes in templates
  const libIncludesDir = path.join(LIB_ROOT, '_includes');
  eleventyConfig.addGlobalData('libIncludesDir', libIncludesDir);

  // Absolute path to project _components/ — used by placeholder.njk for project-first override
  eleventyConfig.addGlobalData('projectComponentsDir', path.join(projectRoot, '_components'));

  // Filter: resolves a component type to its template path (project-first, then lib)
  // Returns null when not found; template falls through to renderMissingComponent
  eleventyConfig.addFilter('resolveComponentTemplatePath', (type) => {
    return resolveComponentPath(type, { projectRoot, libRoot: LIB_ROOT });
  });
  eleventyConfig.addGlobalData('env', {
    environment,
    isProd: environment === 'production'
  });
  eleventyConfig.addGlobalData('buildConfig', {
    useCmsStyles: process.env.MARBAS_USE_CMS_STYLES !== '0',
    useLanguageSwitcher: process.env.MARBAS_USE_LANGUAGE_SWITCHER !== '0'
  });
  eleventyConfig.addGlobalData('marbasRendering', {
    footerMode: process.env.MARBAS_FOOTER_MODE || 'globalData',
    headerMode: process.env.MARBAS_HEADER_MODE || 'globalData'
  });

  eleventyConfig.addFilter('componentTemplateExists', (filePath) => {
    const normalized = String(filePath || '').trim();
    if (!normalized) return false;
    return fs.existsSync(path.resolve(normalized));
  });

  // Project-first Nunjucks loader — resolves includes from project _includes/ before lib
  eleventyConfig.amendLibrary('njk', (env) => {
    env.loaders.unshift(new MarbasResolver({ projectRoot, libRoot: LIB_ROOT }));
  });

  // Layout aliases with project-first override (layout: base → resolves to correct file)
  registerLayoutAliases(eleventyConfig, { projectRoot, libRoot: LIB_ROOT });

  addLibAssetsPassthrough(eleventyConfig, { libRoot: LIB_ROOT });
  addComponentApiPassthrough(eleventyConfig, { projectRoot, libRoot: LIB_ROOT });

  return {
    dir: {
      // input is relative to CWD (projectRoot)
      input: 'pages',
      // relative path from dir.input (pages/) to lib's _includes/ — project overlay in Task 30
      includes: path.relative(path.join(projectRoot, 'pages'), path.join(LIB_ROOT, '_includes')),
      output: path.relative(projectRoot, outputDir)
    }
  };
}
