/**
 * renders design/amp-score-card.svg to amp-score-card.png in real archivo.
 *
 * the svg names Archivo, but archivo is not a system font — every renderer on
 * a stock mac silently falls back to helvetica, which is how the committed png
 * came to be an amp card set in someone else's typeface. so before rendering we
 * inline the four faces the card actually uses, each under its own family name
 * so nothing gets synthesised from a nearby weight.
 *
 *   node design/render.mjs
 */
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const WIDTH = 1080;
const HEIGHT = 1350;

// weight → the file expo loads for it, so the png and the device agree
const FACES = {
  500: '500Medium/Archivo_500Medium.ttf',
  600: '600SemiBold/Archivo_600SemiBold.ttf',
  700: '700Bold/Archivo_700Bold.ttf',
  800: '800ExtraBold/Archivo_800ExtraBold.ttf',
};

const faceCss = Object.entries(FACES)
  .map(([weight, file]) => {
    const ttf = readFileSync(resolve(root, 'node_modules/@expo-google-fonts/archivo', file));
    return `@font-face{font-family:Archivo;font-style:normal;font-weight:${weight};` +
      `src:url(data:font/ttf;base64,${ttf.toString('base64')}) format('truetype');}`;
  })
  .join('\n');

const svg = readFileSync(resolve(here, 'amp-score-card.svg'), 'utf8');
const html = `<!doctype html><meta charset="utf-8"><style>
${faceCss}
html,body{margin:0;padding:0;background:transparent}
svg{display:block}
</style>${svg}`;

const page = resolve(here, '.render.html');
writeFileSync(page, html);

try {
  execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--default-background-color=00000000',
    `--window-size=${WIDTH},${HEIGHT}`,
    `--screenshot=${resolve(here, 'amp-score-card.png')}`,
    `file://${page}`,
  ], { stdio: 'inherit' });
} finally {
  unlinkSync(page);
}

console.log(`wrote design/amp-score-card.png (${WIDTH}x${HEIGHT})`);
