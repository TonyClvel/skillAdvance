#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const skill = path.join(root, '.codex', 'skills', 'apify-health-check', 'scripts', 'health-check.js');
const input = path.join(__dirname, 'apify-snapshot.json');
const output = path.join(__dirname, 'health-report.json');
const result = spawnSync(process.execPath, [skill, '--input', input, '--output', output, '--now', '2026-09-25T12:00:00Z'], { stdio: 'inherit' });
process.exit(result.status === null ? 2 : result.status);
