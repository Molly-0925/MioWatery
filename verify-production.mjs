import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const url = new URL(process.argv[2]);
assert.equal(url.protocol, 'https:');
assert.equal(url.href, url.origin + '/');
const digest = (value) => createHash('sha256').update(value).digest('hex');

async function load(path, type) {
  const response = await fetch(new URL(path, url), {
    redirect: 'manual',
    signal: AbortSignal.timeout(15000)
  });
  const mime = response.headers.get('content-type') || '';
  console.log(path, response.status, mime);
  assert.equal(response.status, 200, path);
  assert.match(mime, type, path);
  return Buffer.from(await response.arrayBuffer());
}

await load('/', /^text\/html/i).then((page) => {
  assert.ok(page.toString('utf8').includes('<title>Mio水汪汪</title>'));
  assert.ok(page.toString('utf8').includes('src="service-config.js"'));
});
const manifest = JSON.parse(await load('/manifest.json', /json/i));
assert.equal(manifest.name, 'Mio水汪汪');
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.start_url, './');
assert.equal(manifest.scope, './');
for (const size of [192, 512]) {
  const icon = manifest.icons.find((entry) => entry.sizes === `${size}x${size}`);
  assert.ok(icon);
  const png = await load('/' + icon.src, /^image\/png/i);
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16), size);
  assert.equal(png.readUInt32BE(20), size);
}
for (const file of ['service-config.js', 'sw.js']) {
  const remote = await load('/' + file, /javascript/i);
  assert.equal(digest(remote), digest(await readFile(new URL(file, import.meta.url))));
}
const dalPath = '/.well-known/assetlinks.json';
const expectedDal = JSON.parse(await readFile(new URL('.' + dalPath, import.meta.url)));
assert.deepEqual(JSON.parse(await load(dalPath, /^application\/json/i)), expectedDal);
