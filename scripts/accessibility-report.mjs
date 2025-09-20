#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

const BASE_URL = process.env.A11Y_BASE_URL || 'https://dev--obsidianriterecords.netlify.app';
const ADMIN_URL = process.env.A11Y_ADMIN_URL || `${BASE_URL.replace(/\/$/, '')}/admin/dashboard`;
const OUT_DIR = process.env.A11Y_OUT_DIR || path.join('docs', 'qa-screenshots');
const chromePath = puppeteer.executablePath();

const targets = [
  {
    url: BASE_URL,
    name: 'lighthouse-home.json',
  },
  {
    url: ADMIN_URL,
    name: 'lighthouse-admin-dashboard.json',
  },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const { url, name } of targets) {
  const outputPath = path.join(OUT_DIR, name);
  const args = [
    '--yes',
    'lighthouse',
    url,
    '--only-categories=accessibility',
    '--quiet',
    '--output=json',
    `--output-path=${outputPath}`,
    "--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage --disable-gpu",
    '--max-wait-for-load=120000',
    '--max-wait-for-fcp=120000',
  ];

  const result = spawnSync('npx', args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      CHROME_PATH: chromePath,
    },
  });
  if (result.status !== 0) {
    console.error(`Accessibility audit failed for ${url}`);
    process.exit(result.status ?? 1);
  }
  console.log(`Saved accessibility report to ${outputPath}`);
}
