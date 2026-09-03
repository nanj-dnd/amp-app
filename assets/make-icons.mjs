/**
 * generates the packaged app assets from the amp mark.
 *
 * these are the three places the logo is a *file* rather than something the app
 * draws: the browser tab, the home-screen icon and the native splash. they all
 * still shipped expo's blue template chevron, because app.json was never
 * pointed away from it — the app looked right everywhere the mark is drawn in
 * code (<VectorMark>), which is exactly why nobody noticed.
 *
 * the mark is the traced vector from src/ui/Logo.tsx, not assets/logo-mark.png:
 * the artwork's lane dashes turn to mush below ~32px, and a favicon is 16px.
 *
 *   node assets/make-icons.mjs
 */
import { writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// traced from the artwork — kept in step with VectorMark in src/ui/Logo.tsx
const LEFT = 'M 48.5 3 L 2.4 86 Q 1.2 89.6 4.6 87.8 L 47.8 71.5 Z';
const RIGHT = 'M 51.5 3 L 97.6 86 Q 98.8 89.6 95.4 87.8 L 52.2 71.5 Z';

const GREEN = '#186D4C';
const GREEN_HI = '#2E9E6B';
const GREEN_DEEP = '#0E5A3D';

/**
 * `inset` is the share of the canvas left as margin. ios rounds the corners of
 * the full square itself, so the mark has to sit well inside it or the corners
 * clip the road where it is widest.
 */
function markSvg({ size, fill, bg, inset = 0.17, lit = false }) {
  const box = size * (1 - inset * 2);
  const x = size * inset;
  // the mark is 100 wide and 88 tall, so centre it on the shorter axis
  const h = box * 0.88;
  // then lift it. the mark is a triangle that widens downward, so its mass sits
  // below its geometric centre and a mathematically centred icon reads as
  // sitting low in the square. 3% of the canvas is what it takes to look right.
  const y = (size - h) / 2 - size * 0.03;

  const ground = lit
    ? `<defs><linearGradient id="g" x1="0.12" y1="0" x2="0.88" y2="1">
         <stop offset="0" stop-color="${GREEN_HI}"/>
         <stop offset="0.5" stop-color="${GREEN}"/>
         <stop offset="1" stop-color="${GREEN_DEEP}"/>
       </linearGradient></defs>
       <rect width="${size}" height="${size}" fill="url(#g)"/>`
    : bg
      ? `<rect width="${size}" height="${size}" fill="${bg}"/>`
      : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${ground}
  <g transform="translate(${x} ${y}) scale(${box / 100})" fill="${fill}">
    <path d="${LEFT}"/><path d="${RIGHT}"/>
  </g>
</svg>`;
}

function render(name, size, svg) {
  const page = resolve(here, `.icon-${name}.html`);
  writeFileSync(
    page,
    `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style>${svg}`,
  );
  try {
    execFileSync(
      CHROME,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        '--default-background-color=00000000',
        `--window-size=${size},${size}`,
        `--screenshot=${resolve(here, name)}`,
        `file://${page}`,
      ],
      { stdio: 'ignore' },
    );
  } finally {
    unlinkSync(page);
  }
  console.log(`wrote assets/${name} (${size}x${size})`);
}

// the home-screen icon: lit metal, because that is what amp's colour is now
render('icon.png', 1024, markSvg({ size: 1024, fill: '#FFFFFF', lit: true }));

// the browser tab: flat. a gradient across 16px is a smudge, not metal.
render('favicon.png', 196, markSvg({ size: 196, fill: '#FFFFFF', bg: GREEN, inset: 0.16 }));

// the native splash sits on its own background, so the mark is bare and green
render('splash-icon.png', 512, markSvg({ size: 512, fill: GREEN, inset: 0.2 }));

// android adaptive: the foreground gets a wide inset because the launcher masks
// it to a circle and crops roughly a third off the square
render('android-icon-foreground.png', 1024, markSvg({ size: 1024, fill: '#FFFFFF', inset: 0.28 }));
render('android-icon-background.png', 1024, `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${GREEN}"/></svg>`);
render('android-icon-monochrome.png', 1024, markSvg({ size: 1024, fill: '#000000', inset: 0.28 }));
