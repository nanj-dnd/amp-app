/**
 * generates the packaged app assets from design/amp-icon.svg.
 *
 * these are the places the logo is a *file* rather than something the app
 * draws. they all shipped expo's blue template chevron until now, because
 * app.json had never been pointed away from the scaffold and every logo the app
 * draws comes from <VectorMark> — so nothing on screen ever looked wrong.
 *
 * the wordmark, not the mark: the mark is a road, and at 60px on a home screen
 * its lane dashes turn to mush, so the name carries it. green on a lit white
 * tile, matching assets/icon.png.
 *
 * archivo is not a system font, so the faces are inlined here exactly as
 * design/render.mjs does it — otherwise chrome falls back to helvetica and the
 * icon quietly stops being an amp icon.
 *
 *   node assets/make-icons.mjs
 */
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const ttf = readFileSync(
  resolve(root, 'node_modules/@expo-google-fonts/archivo/600SemiBold/Archivo_600SemiBold.ttf'),
);
const FACE =
  `@font-face{font-family:Archivo;font-style:normal;font-weight:600;` +
  `src:url(data:font/ttf;base64,${ttf.toString('base64')}) format('truetype');}`;

/* the wordmark, as cut for the ios tile. x/baseline/size are from
   design/amp-icon.svg: ink 149.4,408.4 to 866.4,671.7, mass centred on
   512,512 — 'amp' is one thin descender against a heavy x-height block, so a
   box-centred word reads high. */
const TEXT = { x: 149.4, y: 607.69, size: 370.25, width: 0.7 };

/**
 * `fit` is the share of the 1024 tile the word spans. the ios tile uses 0.70.
 * android wants less: the launcher masks the icon to a circle and only the
 * centre ~66% is guaranteed to survive, so a word cut for a square loses its
 * a and its p.
 */
function word({ fill, fit = TEXT.width, filter = '' }) {
  const k = fit / TEXT.width;
  const f = filter ? ` filter="${filter}"` : '';
  // scale about the tile's centre, so the word stays on its mass
  return `<g transform="translate(512 512) scale(${k}) translate(-512 -512)">
    <text x="${TEXT.x}" y="${TEXT.y}" font-size="${TEXT.size}" font-weight="600" fill="${fill}"${f}>amp</text>
  </g>`;
}

/** the lit white tile the ios icon sits on. */
const TILE = `
  <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F3F3EE"/>
  </linearGradient>
  <radialGradient id="bloom" cx="0.5" cy="0" r="0.9">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.30"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="floor" cx="0.5" cy="1.06" r="0.78">
    <stop offset="0" stop-color="#E4E4DD" stop-opacity="0.55"/><stop offset="1" stop-color="#E4E4DD" stop-opacity="0"/>
  </radialGradient>`;

const INK = `
  <linearGradient id="ink" gradientUnits="userSpaceOnUse" x1="0" y1="408" x2="0" y2="672">
    <stop offset="0" stop-color="#207F59"/><stop offset="1" stop-color="#196B4B"/>
  </linearGradient>
  <filter id="contact" x="-10%" y="-10%" width="120%" height="130%">
    <feDropShadow dx="0" dy="4.6" stdDeviation="6" flood-color="#0C3A28" flood-opacity="0.13"/>
  </filter>`;

const svg = (size, defs, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024" font-family="Archivo, sans-serif"><defs>${defs}</defs>${body}</svg>`;

function render(name, size, markup) {
  const page = resolve(here, `.icon-${name}.html`);
  writeFileSync(
    page,
    `<!doctype html><meta charset="utf-8"><style>${FACE}html,body{margin:0;padding:0;background:transparent}svg{display:block}</style>${markup}`,
  );
  try {
    execFileSync(CHROME, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars',
      '--force-device-scale-factor=1', '--default-background-color=00000000',
      `--window-size=${size},${size}`, `--screenshot=${resolve(here, name)}`, `file://${page}`,
    ], { stdio: 'ignore' });
  } finally {
    unlinkSync(page);
  }
  console.log(`wrote assets/${name} (${size}x${size})`);
}

const tile = `<rect width="1024" height="1024" fill="url(#ground)"/>
  <rect width="1024" height="1024" fill="url(#bloom)"/>
  <rect width="1024" height="1024" fill="url(#floor)"/>`;

// the browser tab: the same tile, no contact shadow — a 6px blur is invisible
// at 16px and only muddies the strokes
render('favicon.png', 196, svg(196, TILE + INK, tile + word({ fill: 'url(#ink)' })));

// the native splash sits on its own ground, so the word is bare
render('splash-icon.png', 512, svg(512, INK, word({ fill: 'url(#ink)' })));

// android adaptive. the launcher masks to a circle and crops roughly a third
// off the square, so the word is cut to 0.60 of the tile to stay inside it.
render('android-icon-foreground.png', 1024,
  svg(1024, INK, word({ fill: 'url(#ink)', fit: 0.6, filter: 'url(#contact)' })));
render('android-icon-background.png', 1024, svg(1024, TILE, tile));
render('android-icon-monochrome.png', 1024, svg(1024, '', word({ fill: '#000000', fit: 0.6 })));
