// Deterministic additions to the existing flat AAC/FLAC/channel wordmarks.
// These are new code-native UI graphics, not edits to existing bitmap logos.
// Run with npm-installed @napi-rs/canvas (or NODE_PATH to a bundled runtime).
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const { writeFileSync, existsSync, mkdirSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const destination = path.join(root, 'Badges');
mkdirSync(destination, { recursive: true });
GlobalFonts.loadSystemFonts();

const specs = [
  ['hlg', 'HLG', 'HYBRID LOG-GAMMA'],
  ['vvc', 'VVC', 'H.266'],
  ['vp9', 'VP9', ''],
  ['mpeg_2', 'MPEG-2', ''],
  ['pcm', 'PCM', ''],
  ['mp3', 'MP3', ''],
  ['vorbis', 'VORBIS', ''],
  ['dvd', 'DVD', ''],
  ['576p_sd', '576p', 'STANDARD DEFINITION'],
  ['1080i_full_hd', '1080i', 'INTERLACED HD'],
  ['8k_ultra_hd', '8K', 'ULTRA HD'],
  ...['1.0','2.1','3.0','4.0','4.1','5.0','6.0','6.1','5.1.2','7.1.4'].map(label => [label.replaceAll('.', '_') + '_audio', label, '', true]),
  ['10ch_audio', '10 CH', '', true],
  ['channels_audio', 'CH', '', true],
];

function speaker(context, x, y, size) {
  context.fillStyle = '#FFFFFF';
  context.beginPath();
  context.moveTo(x, y + size * 0.30);
  context.lineTo(x + size * 0.25, y + size * 0.30);
  context.lineTo(x + size * 0.55, y);
  context.lineTo(x + size * 0.55, y + size);
  context.lineTo(x + size * 0.25, y + size * 0.70);
  context.lineTo(x, y + size * 0.70);
  context.closePath(); context.fill();
  context.strokeStyle = '#FFFFFF'; context.lineWidth = size * 0.07;
  for (const radius of [0.29, 0.46]) {
    context.beginPath();
    context.arc(x + size * 0.48, y + size * 0.50, size * radius, -0.85, 0.85);
    context.stroke();
  }
}

for (const [file, label, subtitle, channels] of specs) {
  const target = path.join(destination, file + '.png');
  if (existsSync(target) && !process.argv.includes('--regenerate')) {
    throw new Error(`Refusing to replace ${file}.png; pass --regenerate only for generated additions.`);
  }
  const height = 160;
  const measured = createCanvas(1, 1).getContext('2d');
  const fontSize = subtitle ? 100 : 114;
  measured.font = `900 ${fontSize}px Arial`;
  const textWidth = measured.measureText(label).width;
  measured.font = '700 25px Arial';
  const subWidth = subtitle ? measured.measureText(subtitle).width : 0;
  const iconWidth = channels ? 118 : 0;
  const width = Math.ceil(Math.max(textWidth + iconWidth, subWidth) + 26);
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  // Default alpha is retained. No opaque plate or padded square canvas.
  context.fillStyle = '#FFFFFF'; context.textBaseline = 'alphabetic';
  context.font = `900 ${fontSize}px Arial`;
  context.textAlign = 'center';
  if (channels) speaker(context, 12, 42, 81);
  context.fillText(label, (width + iconWidth) / 2, subtitle ? 104 : 121);
  if (subtitle) {
    context.font = '700 25px Arial';
    context.fillText(subtitle, width / 2, 143);
  }
  writeFileSync(target, canvas.toBuffer('image/png'));
  console.log(`${file}.png ${width}x${height}`);
}
