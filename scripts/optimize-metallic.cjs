// User-authorized local resizing/compression. Large originals are preserved.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const plan = JSON.parse(fs.readFileSync(path.join(root, 'design', 'metallic-v2.json'), 'utf8'));
const names = process.argv.slice(2);
if (!names.length) throw new Error('Pass exact asset filenames to optimize.');
(async () => {
  for (const name of names) {
    const asset = plan.assets.find(item => item.file === name);
    if (!asset || path.basename(name) !== name) throw new Error('Unknown asset: ' + name);
    const original = path.resolve(root, asset.original);
    const destination = path.resolve(root, asset.optimized);
    const sourceRoot = path.join(root, 'Originals', 'metallic-v2') + path.sep;
    const targetRoot = path.join(root, 'Badges', 'v2') + path.sep;
    if (!original.startsWith(sourceRoot) || !destination.startsWith(targetRoot)) throw new Error('Invalid asset boundary.');
    if (!fs.existsSync(original)) throw new Error('Missing original: ' + name);
    const metadata = await sharp(original).metadata();
    const stats = await sharp(original).stats();
    if (!metadata.hasAlpha || stats.channels[3].min !== 0 || stats.channels[3].max === 0) {
      throw new Error('Expected a genuine transparent PNG: ' + name);
    }
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    await sharp(original)
      .resize({width: 960, height: 240, fit: 'inside', withoutEnlargement: true})
      .png({compressionLevel: 9, adaptiveFiltering: true})
      .toFile(destination);
    const optimized = await sharp(destination).metadata();
    console.log(JSON.stringify({file:name, width:optimized.width, height:optimized.height,
      originalBytes:fs.statSync(original).size, optimizedBytes:fs.statSync(destination).size}));
  }
})().catch(error => {console.error(error.message); process.exitCode=1;});
