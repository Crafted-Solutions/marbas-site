/**
 * Line handling for the preview's child processes (webpack, Eleventy).
 *
 * The preview detects progress from text lines ("compiled successfully", "Server at http…"). On Windows, webpack-cli
 * colours its output even into a pipe (colorette), so ANSI sequences sit between the words and the patterns never
 * match (Task 204). Every line is therefore cleaned once here, before it is matched or logged.
 */

// OSC (ESC ] … BEL or ESC \), CSI (ESC [ or 8-bit U+009B, then parameters and a final byte: colours, cursor moves)
// and the short two-character escapes (ESC ( B charset reset, ESC 7 / ESC 8 save/restore cursor).
// eslint-disable-next-line no-control-regex
const ANSI_RE = /\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)|(?:\u001b\[|\u009b)[0-?]*[ -/]*[@-~]|\u001b[ -/]*[0-~]/g;

/** Remove ANSI escape sequences from a line; plain text is left untouched. */
export function stripAnsi(text) {
  return String(text).replace(ANSI_RE, '');
}

/** Call `onLine` for every non-empty line of `stream`, with ANSI sequences removed. */
export function forwardLines(stream, onLine) {
  let buffer = '';
  const emit = (raw) => {
    const line = stripAnsi(raw);
    if (line.trim()) onLine(line);
  };
  stream.on('data', (chunk) => {
    buffer += chunk.toString('utf8');
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) emit(line);
  });
  stream.on('end', () => {
    if (buffer.trim()) emit(buffer.trim());
  });
}
