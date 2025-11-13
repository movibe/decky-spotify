/**
 * Custom semantic-release plugin to build and create zip archive
 * This plugin runs in the prepare step, before the release is created
 */
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

async function prepare(pluginConfig, context) {
  const { nextRelease, logger } = context;
  const version = nextRelease.version;

  logger.log(`Building release package for version ${version}`);

  // Build the plugin
  logger.log('Building plugin...');
  execSync('pnpm run build', { stdio: 'inherit' });

  // Create release directory structure
  const releaseDir = 'release';
  const pluginDir = join(releaseDir, 'decky-spotify');
  
  // Clean previous release
  if (existsSync(releaseDir)) {
    execSync(`rm -rf ${releaseDir}`, { stdio: 'inherit' });
  }
  
  execSync(`mkdir -p ${pluginDir}`, { stdio: 'inherit' });

  // Copy required files
  logger.log('Copying files...');
  const filesToCopy = [
    { src: 'dist', dest: pluginDir },
    { src: 'plugin.json', dest: pluginDir },
    { src: 'main.py', dest: pluginDir },
    { src: 'package.json', dest: pluginDir },
    { src: 'LICENSE', dest: pluginDir },
  ];

  filesToCopy.forEach(({ src, dest }) => {
    if (existsSync(src)) {
      execSync(`cp -r ${src} ${dest}/`, { stdio: 'inherit' });
    }
  });

  // Copy optional files
  const optionalFiles = [
    { src: 'README.md', dest: pluginDir },
    { src: 'py_modules', dest: pluginDir },
    { src: 'assets', dest: pluginDir },
    { src: 'defaults', dest: pluginDir },
  ];

  optionalFiles.forEach(({ src, dest }) => {
    if (existsSync(src)) {
      execSync(`cp -r ${src} ${dest}/`, { stdio: 'inherit' });
    }
  });

  // Copy backend binaries if they exist
  if (existsSync('backend/out')) {
    execSync(`mkdir -p ${pluginDir}/bin`, { stdio: 'inherit' });
    execSync(`cp -r backend/out/* ${pluginDir}/bin/`, { stdio: 'inherit' });
  }

  // Create zip archive
  logger.log('Creating zip archive...');
  const zipName = `decky-spotify-v${version}.zip`;
  execSync(`cd ${releaseDir} && zip -r ${zipName} decky-spotify/`, { stdio: 'inherit' });

  logger.log(`✅ Release package created: ${releaseDir}/${zipName}`);
}

export default { prepare };

