#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const index = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
if (!fs.existsSync(index)) {
  console.error('Dentovi React bundle missing: ' + index);
  process.exit(1);
}
const html = fs.readFileSync(index, 'utf8');
if (!html.includes('id="root"') || !html.includes('/assets/')) {
  console.error('Dentovi frontend/dist/index.html does not look like a compiled Vite app.');
  process.exit(1);
}
console.log('Dentovi full stack build verified: frontend/dist/index.html present.');
