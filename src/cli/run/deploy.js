import path from 'path';
import { readProjectConfig } from '../../project/config.js';
import { resolveBuildOutputPath } from '../../env/output-paths.js';
import { SimpleFTPDeployer } from '../../deploy/run-deploy.js';

export async function runDeploy({ projectPath, flags }) {
  const environment = flags.env || 'development';
  const absProject = path.resolve(projectPath);

  let config;
  try {
    config = readProjectConfig(absProject);
  } catch (err) {
    process.stderr.write(`cannot read marbas-project.json: ${err.message}\n`);
    process.exit(1);
  }

  const targets = config.deployTargets || {};
  if (Object.keys(targets).length === 0) {
    process.stderr.write(
      'no deploy targets configured in marbas-project.json\n' +
      'Add a deployTargets entry with FTP credentials to deploy.\n'
    );
    process.exit(1);
  }

  const buildDir = resolveBuildOutputPath({ projectRoot: absProject, config, environment });
  const buildDirRel = path.relative(absProject, buildDir);

  const deployer = new SimpleFTPDeployer(environment, {
    rootDir: absProject,
    buildDir: buildDirRel
  });

  try {
    await deployer.run();
  } catch (err) {
    process.stderr.write(`deploy failed: ${err.message}\n`);
    process.exit(1);
  }
}
