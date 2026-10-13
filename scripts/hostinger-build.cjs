#!/usr/bin/env node
'use strict';
// Hostinger serves Express directly, but the React SPA must be built at the repository root.
// Run this on both install and build: whichever lifecycle Hostinger invokes first builds
// the nested frontend. The second invocation is a safe no-op on the same deployment.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const exists = rel => fs.existsSync(path.join(ROOT, rel));
const run = (args, step) => {
  console.log('[Dentovi Build] ' + step);
  const result = spawnSync(npm, args, { cwd: ROOT, env: process.env, stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(step + ' failed with exit ' + result.status);
};

try {
  if (!exists('backend/node_modules/express/package.json')) {
    run(['--prefix', 'backend', 'ci', '--omit=dev'], 'Install Express backend dependencies');
  }
  if (!exists('frontend/node_modules/vite/bin/vite.js')) {
    // Vite lives in frontend/devDependencies. Production NODE_ENV is allowed,
    // because these are build-time dependencies only.
    run(['--prefix', 'frontend', 'ci', '--include=dev'], 'Install React/Vite build dependencies');
  }
  if (!exists('frontend/dist/index.html')) {
    run(['--prefix', 'frontend', 'run', 'build'], 'Build React frontend to frontend/dist');
  }
  if (!exists('frontend/dist/index.html')) {
    throw new Error('Expected frontend/dist/index.html is missing after build');
  }
  console.log('[Dentovi Build] Both backend and frontend are ready.');
} catch (error) {
  console.error('[Dentovi Build] ' + error.message);
  process.exitCode = 1;
}
