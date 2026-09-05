/**
 * Metro configuration for the Gainly mobile app.
 * Resolves workspace packages from the monorepo root.
 *
 * Without this, Metro cannot find @gainly/* packages because pnpm uses
 * symlinks in node_modules, and Metro doesn't follow them by default.
 */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the monorepo root (two levels up from apps/mobile)
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root so Metro picks up changes in packages/*
config.watchFolders = [monorepoRoot];

// Resolve modules from both the app's node_modules and the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Ensure Metro follows symlinks into workspace packages
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
