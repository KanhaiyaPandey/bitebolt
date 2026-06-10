const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Required for pnpm monorepos: watch all workspace packages and resolve
// modules from both the app's and the workspace root's node_modules.
config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = withNativeWind(config, {
  input: path.join(__dirname, 'src/styles/global.css'),
  configPath: path.join(__dirname, 'tailwind.config.js'),
});
