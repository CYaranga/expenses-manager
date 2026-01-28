#!/usr/bin/env bun
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Read the built index.html
const indexHtmlPath = join(__dirname, '../web/dist/expenses-manager/index.html');
const appTsPath = join(__dirname, '../api/src/app.ts');

try {
  const indexHtml = readFileSync(indexHtmlPath, 'utf-8');
  const appTs = readFileSync(appTsPath, 'utf-8');

  // Escape backticks and ${} in the HTML for template literal
  const escapedHtml = indexHtml
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${')
    .trim();

  // Replace the spaHtml constant in app.ts
  const updatedAppTs = appTs.replace(
    /const spaHtml = `[\s\S]*?`;/,
    `const spaHtml = \`${escapedHtml}\`;`
  );

  writeFileSync(appTsPath, updatedAppTs);
  console.log('Successfully synced SPA HTML to app.ts');
} catch (error) {
  console.error('Error syncing SPA HTML:', error);
  process.exit(1);
}
