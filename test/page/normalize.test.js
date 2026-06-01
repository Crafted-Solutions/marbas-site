import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTraits, extractClasses, extractVariantName, buildComponentYamlData } from '../../src/page/normalize.js';

test('normalizeTraits — converts PascalCase keys to camelCase', () => {
  const traits = {
    Title: [{ value: 'Hello World', culture: 'de-DE' }]
  };
  const result = normalizeTraits(traits);
  assert.equal(result.title, 'Hello World');
  assert.equal(result.titleCulture, 'de-DE');
  assert.equal(result.Title, undefined);
});

test('normalizeTraits — skips internal fields', () => {
  const traits = {
    Title: [{ value: 'Test' }],
    RenderingParam: [{ value: 'rp-guid' }],
    PlaceholderConfig: [{ value: 'cfg' }]
  };
  const result = normalizeTraits(traits);
  assert.ok('title' in result);
  assert.ok(!('renderingParam' in result));
  assert.ok(!('placeholderConfig' in result));
});

test('normalizeTraits — media fields keep GUID, no culture', () => {
  const guid = 'abc-123-media-guid';
  const traits = {
    Image: [{ value: guid, culture: 'de-DE' }]
  };
  const result = normalizeTraits(traits);
  assert.equal(result.image, guid);
  assert.equal(result.imageCulture, undefined);
});

test('normalizeTraits — skips empty value arrays', () => {
  const traits = {
    Title: [],
    Description: [{ value: 'Text' }]
  };
  const result = normalizeTraits(traits);
  assert.ok(!('title' in result));
  assert.equal(result.description, 'Text');
});

test('normalizeTraits — trims string values', () => {
  const traits = {
    Title: [{ value: '  padded  ' }]
  };
  const result = normalizeTraits(traits);
  assert.equal(result.title, 'padded');
});

test('normalizeTraits — null traits returns empty object', () => {
  assert.deepEqual(normalizeTraits(null), {});
  assert.deepEqual(normalizeTraits(undefined), {});
});

test('extractClasses — joins class strings from rendering params', () => {
  const params = [
    { Classes: [{ value: 'btn-primary' }] },
    { Classes: [{ value: 'large' }] }
  ];
  assert.equal(extractClasses(params), 'btn-primary large');
});

test('extractClasses — returns empty string for empty array', () => {
  assert.equal(extractClasses([]), '');
  assert.equal(extractClasses(null), '');
});

test('extractClasses — skips items without Classes', () => {
  const params = [
    { Classes: [{ value: 'hero' }] },
    { Other: 'field' }
  ];
  assert.equal(extractClasses(params), 'hero');
});

test('extractVariantName — extracts variant from rendering param', () => {
  const param = { VariantName: [{ value: 'compact' }] };
  assert.equal(extractVariantName(param), 'compact');
});

test('extractVariantName — returns null when absent', () => {
  assert.equal(extractVariantName({}), null);
  assert.equal(extractVariantName(null), null);
});

test('buildComponentYamlData — assembles full component object', () => {
  const traits = {
    Title: [{ value: 'Hero Title' }]
  };
  const renderingParams = [{ Classes: [{ value: 'hero-class' }] }];
  const renderingParam = { VariantName: [{ value: 'dark' }] };

  const result = buildComponentYamlData('guid-123', traits, renderingParams, renderingParam, 'HeroSection');

  assert.equal(result.componentType, 'HeroSection');
  assert.equal(result.id, 'guid-123');
  assert.equal(result.title, 'Hero Title');
  assert.equal(result.classes, 'hero-class');
  assert.equal(result.variantName, 'dark');
});

test('buildComponentYamlData — omits classes and variant when absent', () => {
  const result = buildComponentYamlData('guid-456', {}, [], null, 'TextBlock');
  assert.equal(result.componentType, 'TextBlock');
  assert.equal(result.id, 'guid-456');
  assert.equal(result.classes, undefined);
  assert.equal(result.variantName, undefined);
});
