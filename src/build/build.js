import { runPipeline } from './pipeline.js';

/**
 * Run a full build for a Marbas project (CLI entry point).
 *
 * Thin adapter over the shared {@link runPipeline} core — the CLI builds with
 * no cleaning, no optimize and no serve. The public signature is unchanged so
 * existing callers and tests keep working.
 *
 * @param {object} options
 * @param {string} options.projectPath   Absolute or relative path to project root
 * @param {string} [options.environment] Build environment (default: 'development')
 * @param {string} [options.libRoot]     Override lib root (for testing)
 * @param {Function} [options.onLog]     Receives log lines as strings
 */
export async function build({ projectPath, environment = 'development', libRoot, onLog = () => {} } = {}) {
  await runPipeline({ projectPath, environment, libRoot, onLog });
}
