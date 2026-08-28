/**
 * the six-indicator roll-up, checked against the worked example that ships in
 * amp_card_indicators.xlsx ('Batting - Pace', sample scores in column E).
 * if these drift, the card and the workbook disagree and one of them is lying.
 *   npm run test:indicators
 */
import { rollUp, hasIndicators, cardTierFor, confidenceFor } from './indicators';
import type { Scores } from './kpis';

const fail: string[] = [];
const eq = (label: string, got: any, want: any) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) fail.push(`${label}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
};
const near = (label: string, got: number | null, want: number, tol = 0.01) => {
  if (got === null || Math.abs(got - want) > tol) fail.push(`${label}: got ${got} want ~${want}`);
};

/* the workbook's sample column: blanks are genuinely absent, not zero */
const sample: Scores = {
  'balanced-stance-weight-distribution': 8,
  'head-position-stillness-at-guard': 7,
  'bat-position-at-guard': null,
  'backlift-height-timing-vs-pace': 8,
  'backlift-direction': 7,
  'front-foot-initiation-decisiveness-vs-pace': 9,
  'front-foot-landing-direction': 8,
  'head-weight-over-the-front-knee-at-contact': 7,
  'back-foot-initiation-decisiveness-vs-pace': null,
  'depth-balance-of-back-foot-movement': null,
  'weight-transfer-into-the-shot-vs-pace': null,
  'bat-face-control-at-contact': 8,
  'contact-point-under-the-eyes': 7,
  'top-hand-control-vs-bottom-hand-dominance': 6,
  'response-to-short-pitched-bowling': null,
  'follow-through-extension-balance': 8,
  'head-stability-through-shot': 8,
  'length-line-judgement-under-pace': 6,
  'consistency-across-session': 7,
};

const r = rollUp(sample, 'pace')!;
const by = (id: string) => r.results.find((x) => x.indicator.id === id)!;

/* every indicator, to the workbook's own roll-up */
near('bal', by('bal').score, 75.3691);
near('pwr', by('pwr').score, 71.7978);
near('tim', by('tim').score, 78.2707);
near('ctl', by('ctl').score, 72.9480);
near('ftw', by('ftw').score, 84.6154);
near('iq', by('iq').score, 64.1176);

/* the card summary block */
near('card rating', r.rating, 74.7222);
near('coverage', r.coverage, 0.72, 0.0001);
eq('confidence', r.confidence, 'medium');
eq('tier', r.tier, 'silver');
eq('not provisional at 72%', r.provisional, false);

/* per-indicator coverage is its own number, not the card's */
near('ftw coverage', by('ftw').coverage, 9.1 / 16.8, 0.0001);

/* the rating is the whole fraction, not the mean of the six — the mean would
   reweight the indicators by how much of each happened to be visible */
const mean = r.results.reduce((s, x) => s + (x.score ?? 0), 0) / 6;
if (Math.abs(mean - (r.rating ?? 0)) < 0.01) fail.push('rating must not equal the mean of the six');

/* a blank kpi leaves both sides of the fraction: scoring nothing at all is not
   the same as being scored zero */
const allBlank = Object.fromEntries(Object.keys(sample).map((k) => [k, null])) as Scores;
const blank = rollUp(allBlank, 'pace')!;
eq('nothing scored -> every indicator n/a', blank.results.every((x) => x.score === null), true);
eq('nothing scored -> no rating', blank.rating, null);
eq('nothing scored -> no tier', blank.tier, null);

const zeroed = Object.fromEntries(Object.keys(sample).map((k) => [k, 0])) as Scores;
const zero = rollUp(zeroed, 'pace')!;
eq('scored zero -> a real 0, not n/a', zero.rating, 0);
eq('scored zero -> full coverage', Math.round(zero.coverage * 100), 100);

/* tiers and confidence at their exact boundaries */
eq('85 is elite', cardTierFor(85), 'elite');
eq('84.9 is gold', cardTierFor(84.9), 'gold');
eq('75 is gold', cardTierFor(75), 'gold');
eq('65 is silver', cardTierFor(65), 'silver');
eq('64.9 is bronze', cardTierFor(64.9), 'bronze');
eq('0.8 is high', confidenceFor(0.8), 'high');
eq('0.6 is medium', confidenceFor(0.6), 'medium');
eq('0.599 is low', confidenceFor(0.599), 'low');

/* tiers with no share table say so rather than inventing one */
eq('pace has shares', hasIndicators('pace'), true);
eq('spin has shares', hasIndicators('spin'), true);
eq('foundation has none', hasIndicators('foundation'), false);
eq('development has none', hasIndicators('development'), false);
eq('no shares -> no roll-up', rollUp(sample, 'foundation'), null);

if (fail.length) {
  console.error(`indicators: ${fail.length} failure(s)`);
  for (const f of fail) console.error('  ' + f);
  process.exit(1);
}
console.log('indicators: ok');
