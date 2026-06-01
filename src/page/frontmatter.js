import YAML from 'yaml';

export const APP_ONLY_FRONTMATTER_KEYS = ['_editor', '_ai', '_audit'];

/**
 * Parses frontmatter + body from markdown file content.
 *
 * @param {string} fileContent
 * @returns {{ data: Record<string, unknown>, body: string }}
 */
export function parseFrontmatter(fileContent) {
  if (!fileContent.startsWith('---')) {
    return { data: {}, body: fileContent };
  }

  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n?)([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: fileContent };
  }

  const [, frontmatterContent, lineBreak, body] = match;
  return {
    data: YAML.parse(frontmatterContent) || {},
    body: body ? `${lineBreak}${body}` : ''
  };
}

/**
 * Serializes a frontmatter data object + body back into markdown.
 *
 * @param {Record<string, unknown>} data
 * @param {string} [body]
 * @returns {string}
 */
export function serializeFrontmatter(data, body = '') {
  const yamlContent = YAML.stringify(data, { indent: 2, lineWidth: 0 });
  return `---\n${yamlContent}---${body || '\n'}`;
}
