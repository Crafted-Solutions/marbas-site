// Converts Marbas trait format to normalized flat format for YAML frontmatter

const DEFAULT_MEDIA_FIELDS = ['Image', 'Image1', 'Image2', 'Video', 'PosterImage'];

const SKIP_FIELDS = ['RenderingParam', 'PlaceholderConfig', 'PlaceholderContent', 'Placeholders'];

function toCamelCase(str) {
  if (!str) return '';
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function cleanValue(value) {
  if (value === undefined || value === null) return null;

  if (typeof value === 'string') {
    value = value.trim();
    value = value.replace(/^(['"])(.*)\1$/, '$2');
    return value.trim();
  }

  return value;
}

/**
 * Normalizes Marbas trait data to a flat key-value format for YAML frontmatter.
 *
 * Input:  { Title: [{ value: "Hello", culture: "de-DE", grainId: "..." }] }
 * Output: { title: "Hello", titleCulture: "de-DE" }
 *
 * @param {object} traits  Raw traits object from Marbas API
 * @param {string[]} [mediaFields]  Field names that should keep GUIDs only
 * @returns {object}
 */
export function normalizeTraits(traits, mediaFields = DEFAULT_MEDIA_FIELDS) {
  if (!traits) return {};

  const normalized = {};

  for (const [key, valueArray] of Object.entries(traits)) {
    if (SKIP_FIELDS.includes(key)) continue;
    if (!Array.isArray(valueArray) || valueArray.length === 0) continue;

    const traitData = valueArray[0];
    const camelKey = toCamelCase(key);

    if (traitData.value === undefined && traitData.value === null) continue;

    if (mediaFields.includes(key)) {
      normalized[camelKey] = traitData.value || null;
    } else {
      normalized[camelKey] = cleanValue(traitData.value);
      if (traitData.culture) {
        normalized[`${camelKey}Culture`] = traitData.culture;
      }
    }
  }

  return normalized;
}

/**
 * Extracts a space-separated CSS class string from rendering parameters.
 *
 * @param {Array} renderingParams
 * @returns {string}
 */
export function extractClasses(renderingParams) {
  if (!Array.isArray(renderingParams)) return '';

  return renderingParams
    .map((item) => item?.Classes?.[0]?.value)
    .filter((value) => typeof value === 'string')
    .join(' ')
    .trim();
}

/**
 * Extracts the variant name from a single rendering parameter object.
 *
 * @param {object} renderingParam
 * @returns {string|null}
 */
export function extractVariantName(renderingParam) {
  if (renderingParam?.VariantName?.[0]?.value) {
    return cleanValue(renderingParam.VariantName[0].value);
  }
  return null;
}

/**
 * Resolves the component type key from rendering parameters.
 *
 * @param {Array} renderingParams
 * @param {Function} getTraitsFn  Async function to fetch traits by GUID
 * @returns {Promise<string|null>}
 */
export async function extractComponentType(renderingParams, getTraitsFn) {
  if (!Array.isArray(renderingParams) || renderingParams.length === 0) return null;

  for (const param of renderingParams) {
    if (param?.Component && Array.isArray(param.Component) && param.Component.length > 0) {
      const componentGuid = param.Component[0].value;
      try {
        const componentConfig = await getTraitsFn(componentGuid);
        if (componentConfig?.Key?.[0]?.value) {
          return cleanValue(componentConfig.Key[0].value);
        }
      } catch (error) {
        console.error(`Error fetching component config for ${componentGuid}:`, error);
      }
    }
  }

  return null;
}

/**
 * Builds a normalized component data object for YAML output.
 *
 * @param {string} componentGuid
 * @param {object} componentTraits
 * @param {Array} renderingParams
 * @param {object} renderingParam  First rendering param (for variant info)
 * @param {string} componentType
 * @returns {object}
 */
export function buildComponentYamlData(componentGuid, componentTraits, renderingParams, renderingParam, componentType) {
  const normalized = normalizeTraits(componentTraits);

  const result = { componentType, id: componentGuid, ...normalized };

  const classes = extractClasses(renderingParams);
  if (classes) result.classes = classes;

  const variant = extractVariantName(renderingParam);
  if (variant) result.variantName = variant;

  return result;
}

async function getRenderingParametersForComponent(rpRefs, getTraitsFn) {
  if (!rpRefs || !Array.isArray(rpRefs)) return [];

  const results = [];
  for (const ref of rpRefs) {
    if (ref?.value) {
      try {
        const traits = await getTraitsFn(ref.value);
        if (traits) results.push(traits);
      } catch (error) {
        console.error(`Error fetching rendering param ${ref.value}:`, error);
      }
    }
  }
  return results;
}

async function processMediaFields(normalized, mediaExporter, lang) {
  if (!mediaExporter) return normalized;

  const result = { ...normalized };

  for (const field of ['image', 'image1', 'image2']) {
    if (result[field] && typeof result[field] === 'string') {
      const imageData = await mediaExporter.processImage(result[field], lang);
      result[field] = imageData || result[field];
    }
  }

  if (result.video && typeof result.video === 'string') {
    const videoData = await mediaExporter.processVideo(result.video);
    result.video = videoData || result.video;
  }

  if (result.posterImage && typeof result.posterImage === 'string') {
    const posterData = await mediaExporter.processImage(result.posterImage, lang);
    result.posterImage = posterData || result.posterImage;
  }

  return result;
}

/**
 * Processes a single component: fetches all data and normalizes it.
 *
 * @param {string} componentGuid
 * @param {Function} getTraitsFn  Async function to fetch traits by GUID
 * @param {object} [mediaExporter]
 * @param {string} [lang]
 * @returns {Promise<object|null>}
 */
export async function processComponent(componentGuid, getTraitsFn, mediaExporter = null, lang = 'de') {
  try {
    const componentTraits = await getTraitsFn(componentGuid);

    if (!componentTraits) {
      console.warn(`Could not fetch traits for component: ${componentGuid}`);
      return null;
    }

    const rpArray = componentTraits.RenderingParam
      ? await getRenderingParametersForComponent(componentTraits.RenderingParam, getTraitsFn)
      : [];

    const rpSingle = componentTraits.RenderingParam?.[0]?.value
      ? await getTraitsFn(componentTraits.RenderingParam[0].value)
      : null;

    const componentType = await extractComponentType(rpArray, getTraitsFn);

    if (!componentType) {
      console.warn(`Could not resolve component type for: ${componentGuid}`);
      return null;
    }

    const normalizedData = buildComponentYamlData(componentGuid, componentTraits, rpArray, rpSingle, componentType);
    return await processMediaFields(normalizedData, mediaExporter, lang);

  } catch (error) {
    console.error(`Error processing component ${componentGuid}:`, error);
    return null;
  }
}
