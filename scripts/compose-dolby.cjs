// Explicitly authorized by the user: reuse one approved Dolby header pixel-for-pixel.
// All generated text layers and previous originals are preserved separately.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const files = ['dolby_digital.png', 'dolby_digital_plus.png', 'dolby_atmos.png', 'dolby_vision.png',
  'vis-atmos-dv.png', 'vis-dd-dv.png', 'vis-ddp-dv.png', 'vis-truehd-dv.png'];
const labelRegions = {
  'dolby_digital.png': {top: 430, height: 295},
  'dolby_digital_plus.png': {top: 480, height: 288},
  'dolby_atmos.png': {top: 445, height: 283},
  'dolby_vision.png': {top: 430, height: 295},
};
const originalRoot = path.join(root, 'Originals', 'metallic-v2');
const layerRoot = path.join(root, 'Originals', 'dolby-labels');
const variantRoot = path.join(root, 'Originals', 'variants', 'dolby-before-standardization');
const approved = path.join(root, 'Originals', 'references', 'dolby-approved.png');
const width = 2048, height = 768, headerHeight = 475;
const rebuild = process.argv.slice(2).includes('--rebuild');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const fail = message => { throw new Error(message); };

(async () => {
  const reference = await sharp(approved).metadata();
  if (reference.width !== width || reference.height !== height || !reference.hasAlpha) {
    fail('Approved source must be the untouched 2048x768 transparent PNG.');
  }
  const header = await sharp(approved).extract({left:0, top:0, width, height:headerHeight}).png().toBuffer();
  const headerPixels = await sharp(header).ensureAlpha().raw().toBuffer();
  const headerHash = digest(headerPixels);
  fs.mkdirSync(layerRoot, {recursive:true});
  fs.mkdirSync(variantRoot, {recursive:true});
  // Prepare and validate every layer before replacing any selected original.
  const prepared = [];
  for (const file of files) {
    const destination = path.join(originalRoot, file);
    const backup = path.join(variantRoot, file);
    const labelPath = path.join(layerRoot, file);
    if (fs.existsSync(backup) && !rebuild) fail('Backup exists; use --rebuild only for this selected Dolby family: ' + file);
    let label;
    if (fs.existsSync(labelPath)) {
      label = await sharp(labelPath).trim().png().toBuffer();
    } else if (rebuild) {
      fail('A rebuild requires all saved label layers: ' + file);
    } else if (labelRegions[file]) {
      if (!fs.existsSync(destination)) fail('Missing current Dolby original: ' + file);
      const source = file === 'dolby_digital_plus.png' ? approved : destination;
      const metadata = await sharp(source).metadata(), region = labelRegions[file];
      if (region.top + region.height > metadata.height) fail('Unexpected original dimensions: ' + file);
      const cropped = await sharp(source).extract({left:0, top:region.top, width:metadata.width, height:region.height}).png().toBuffer();
      label = await sharp(cropped).trim().png().toBuffer();
    } else {
      if (!fs.existsSync(labelPath)) fail('Missing generated combo label: ' + file);
      label = await sharp(labelPath).trim().png().toBuffer();
    }
    const labelInfo = await sharp(label).metadata();
    if (!labelInfo.hasAlpha) fail('Label lost transparency: ' + file);
    const resizedLabel = await sharp(label).resize({width:1940, height:200, fit:'inside', withoutEnlargement:true}).png().toBuffer();
    const labelSize = await sharp(resizedLabel).metadata();
    const top = 505 + Math.floor((200 - labelSize.height) / 2);
    const canvas = await sharp({create:{width,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
      .composite([{input:resizedLabel,left:Math.floor((width-labelSize.width)/2),top}])
      .ensureAlpha().raw().toBuffer();
    // Raw copy avoids alpha-premultiplication rounding or any brand-mark resampling.
    headerPixels.copy(canvas,0);
    const image = await sharp(canvas,{raw:{width,height,channels:4}})
      .png({compressionLevel:9,adaptiveFiltering:true}).toBuffer();
    const actualHeader = await sharp(image).extract({left:0,top:0,width,height:headerHeight}).ensureAlpha().raw().toBuffer();
    if (digest(actualHeader) !== headerHash) fail('Header pixels changed: ' + file);
    prepared.push({file,destination,backup,labelPath,label,image});
  }
  await sharp(header).toFile(path.join(root,'Originals','references','dolby-header.png'));
  for (const item of prepared) {
    if (fs.existsSync(item.destination) && !fs.existsSync(item.backup)) fs.copyFileSync(item.destination,item.backup,fs.constants.COPYFILE_EXCL);
    if (!fs.existsSync(item.labelPath)) fs.writeFileSync(item.labelPath,item.label,{flag:'wx'});
    fs.writeFileSync(item.destination,item.image);
    console.log(JSON.stringify({file:item.file,headerSHA256:headerHash,width,height}));
  }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
