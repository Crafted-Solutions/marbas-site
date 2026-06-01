import { runDoctor, formatReport } from '../../doctor/index.js';

export function runDoctorCommand({ projectPath, flags }) {
  if (!projectPath) {
    process.stderr.write('Usage: marbas-site doctor <path>\n');
    process.exit(1);
  }

  const useJson = Boolean(flags.json);
  const useColor = !flags['no-color'] && process.stdout.isTTY !== false;

  const report = runDoctor({ projectPath });

  if (useJson) {
    process.stdout.write(JSON.stringify(report.checks, null, 2) + '\n');
  } else {
    process.stdout.write(formatReport(report, { color: useColor }) + '\n');
  }

  process.exit(report.hasError ? 1 : 0);
}
