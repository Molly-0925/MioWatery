import { copyFileSync, existsSync, mkdirSync } from 'node:fs';

const output = new URL('./public/', import.meta.url);
const files = ['index.html', 'manifest.json', 'icon-192-pwa.png', 'icon-512.png',
  'sw.js', 'service-config.js', 'LICENSE', '_headers'];
if (existsSync(new URL('./.well-known/assetlinks.json', import.meta.url))) {
  files.push('.well-known/assetlinks.json');
}
mkdirSync(output, { recursive: true });
for (const file of files) {
  const target = new URL(file, output);
  mkdirSync(new URL('.', target), { recursive: true });
  copyFileSync(new URL(file, import.meta.url), target);
}
