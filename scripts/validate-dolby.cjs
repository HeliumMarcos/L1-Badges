// Check the approved header pixel-for-pixel, including optimized TV assets.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const plan = JSON.parse(fs.readFileSync(path.join(root,'design','metallic-v2.json'),'utf8'));
const digest = b => crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
  const definition = plan.dolbyHeader;
  if (!definition || definition.files.length !== 8) throw new Error('Missing common Dolby header definition.');
  const approved = path.join(root,definition.reference);
  const master = await sharp(approved).extract({left:0,top:0,width:2048,height:475}).ensureAlpha().raw().toBuffer();
  const masterHash = digest(master);
  if (masterHash !== definition.rawSHA256) throw new Error('Approved source changed.');
  let optimizedHash;
  for (const file of definition.files) {
    const asset = plan.assets.find(a=>a.file===file);
    if (!asset || asset.status !== 'ready') throw new Error('Dolby asset is not ready: '+file);
    const original = path.join(root,asset.original), optimized=path.join(root,asset.optimized);
    const actual = await sharp(original).extract({left:0,top:0,width:2048,height:475}).ensureAlpha().raw().toBuffer();
    if (digest(actual) !== masterHash) throw new Error('Original header changed: '+file);
    const metadata = await sharp(optimized).metadata();
    if (metadata.width !== 640 || metadata.height !== 240 || !metadata.hasAlpha) throw new Error('TV dimensions/alpha changed: '+file);
    // Stop before the label boundary to exclude interpolation of differing text.
    const tvHeader = await sharp(optimized).extract({left:0,top:0,width:640,height:140}).ensureAlpha().raw().toBuffer();
    const currentHash = digest(tvHeader);
    if (optimizedHash && optimizedHash !== currentHash) throw new Error('Optimized headers differ: '+file);
    optimizedHash = currentHash;
    if (fs.statSync(optimized).size >= fs.statSync(original).size) throw new Error('No optimization gain: '+file);
  }
  console.log(JSON.stringify({originals:8,optimized:8,identicalHeaders:true,originalHeaderSHA256:masterHash,optimizedHeaderSHA256:optimizedHash}));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
