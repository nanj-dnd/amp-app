import { SHEETS, type Tier, type Scores } from './kpis';

/**
 * the six indicators, and how a kpi sheet collapses into them.
 *
 * generated from amp_card_indicators.xlsx (amp intelligence — six-indicator
 * player card model). the sheets score technique kpi by kpi; nobody reads
 * nineteen numbers off a card, so each kpi's points are split across the six
 * indicators by a share that sums to 1.00, and the card prints the six.
 *
 * no indicator is a single section renamed — every one of them draws on kpis
 * from three or more sections, which is the point: "balance" is a property of
 * the whole action, not of the setup rows.
 *
 * the blank-vs-zero rule from the kpi sheets survives intact and is the reason
 * this is honest. a blank kpi ("wrong camera angle", "no back-foot ball in the
 * session") leaves BOTH sides of the fraction, so it cannot drag an indicator
 * down. that is also why every indicator carries its own coverage: an 84 built
 * on 40% coverage is not an 84.
 */

export type IndicatorId = 'bal' | 'pwr' | 'tim' | 'ctl' | 'ftw' | 'iq';

export type Indicator = {
  id: IndicatorId;
  /** the three-letter code the card prints */
  code: string;
  label: string;
  blurb: string;
};

/** order matters: it is the share-tuple order and the order the card prints. */
export const INDICATORS: Indicator[] = [
  { id: 'bal', code: 'bal', label: 'balance', blurb: 'stability from setup to completion: stance, head position, knee brace, landing control.' },
  { id: 'pwr', code: 'pwr', label: 'power', blurb: 'the force-generating chain: weight transfer, run-up speed, trunk flexion, rotation velocity, arm speed.' },
  { id: 'tim', code: 'tim', label: 'timing', blurb: 'when things happen relative to the ball: backlift timing, contact point, delayed arm, late release.' },
  { id: 'ctl', code: 'ctl', label: 'control', blurb: 'precision of line and shape: bat face, landing direction, wrist and seam position, elbow action.' },
  { id: 'ftw', code: 'ftw', label: 'footwork', blurb: 'movement into position: front and back foot initiation, approach, pivot, delivery stride.' },
  { id: 'iq', code: 'iq', label: 'cricket iq', blurb: 'reading and adapting: length and line judgement, playing with the spin, disguise, session consistency.' },
];

/** [bal, pwr, tim, ctl, ftw, iq] — sums to 1.00 on every row. */
type Share = [number, number, number, number, number, number];

/**
 * only the pace and spin sheets have been split. foundation and development
 * are deliberately absent rather than guessed at: a made-up share would print
 * a confident indicator on evidence nobody assigned. rollUp returns null for
 * a tier it has no shares for, and the card falls back to the rating alone.
 */
const SHARES: Partial<Record<Tier, Record<string, Share>>> = {
  pace: {
    'balanced-stance-weight-distribution': [0.7, 0, 0, 0.3, 0, 0],
    'head-position-stillness-at-guard': [0.5, 0, 0.5, 0, 0, 0],
    'bat-position-at-guard': [0.3, 0, 0, 0.7, 0, 0],
    'backlift-height-timing-vs-pace': [0, 0.4, 0.6, 0, 0, 0],
    'backlift-direction': [0, 0.3, 0, 0.7, 0, 0],
    'front-foot-initiation-decisiveness-vs-pace': [0, 0, 0.4, 0, 0.6, 0],
    'front-foot-landing-direction': [0, 0, 0, 0.3, 0.7, 0],
    'head-weight-over-the-front-knee-at-contact': [0.5, 0.3, 0, 0.2, 0, 0],
    'back-foot-initiation-decisiveness-vs-pace': [0, 0, 0.4, 0, 0.6, 0],
    'depth-balance-of-back-foot-movement': [0.5, 0, 0, 0, 0.5, 0],
    'weight-transfer-into-the-shot-vs-pace': [0.3, 0.7, 0, 0, 0, 0],
    'bat-face-control-at-contact': [0, 0, 0.2, 0.8, 0, 0],
    'contact-point-under-the-eyes': [0.4, 0, 0.6, 0, 0, 0],
    'top-hand-control-vs-bottom-hand-dominance': [0, 0.4, 0, 0.6, 0, 0],
    'response-to-short-pitched-bowling': [0.2, 0, 0.3, 0, 0, 0.5],
    'follow-through-extension-balance': [0.6, 0.4, 0, 0, 0, 0],
    'head-stability-through-shot': [0.7, 0, 0.3, 0, 0, 0],
    'length-line-judgement-under-pace': [0, 0, 0, 0, 0, 1],
    'consistency-across-session': [0, 0, 0, 0.3, 0, 0.7],
  },
  spin: {
    'balanced-stance-readiness': [0.7, 0, 0, 0.3, 0, 0],
    'head-position-watching-the-hand': [0, 0, 0.5, 0, 0, 0.5],
    'bat-position-at-guard': [0.3, 0, 0, 0.7, 0, 0],
    'backlift-height-timing-vs-spin': [0, 0.4, 0.6, 0, 0, 0],
    'backlift-direction': [0, 0.3, 0, 0.7, 0, 0],
    'decisive-advance-to-the-pitch-of-the-ball': [0, 0, 0.3, 0, 0.7, 0],
    'front-foot-landing-at-or-beyond-the-pitch-of-the-ball': [0, 0, 0, 0, 0.6, 0.4],
    'weight-transfer-forward-through-the-shot': [0.4, 0.6, 0, 0, 0, 0],
    'decisive-back-across-depth-of-movement': [0, 0, 0.3, 0, 0.7, 0],
    'balance-weight-transfer-into-the-shot-spin': [0.5, 0.5, 0, 0, 0, 0],
    'cut-pull-shot-control-off-the-back-foot': [0, 0.5, 0, 0.5, 0, 0],
    'playing-with-the-spin': [0, 0, 0, 0.5, 0, 0.5],
    'soft-hands-controlled-bat-speed-into-contact': [0, 0, 0.3, 0.7, 0, 0],
    'late-contact-playing-the-ball-off-the-pitch': [0, 0, 0.8, 0, 0, 0.2],
    'front-knee-drop-head-position-over-the-ball': [0.6, 0, 0, 0.4, 0, 0],
    'contact-point-in-front-of-the-stumps': [0, 0, 0.6, 0.4, 0, 0],
    'follow-through-extension-balance': [0.6, 0.4, 0, 0, 0, 0],
    'head-stability-through-shot': [0.7, 0, 0.3, 0, 0, 0],
    'length-turn-read-leading-to-a-decisive-front-back-call': [0, 0, 0, 0, 0, 1],
    'consistency-across-session': [0, 0, 0, 0.3, 0, 0.7],
  },
};

export const hasIndicators = (tier: Tier): boolean => SHARES[tier] !== undefined;

export type IndicatorResult = {
  indicator: Indicator;
  /** 0–100, or null when every kpi feeding it was blank — the card prints n/a */
  score: number | null;
  /** share of this indicator's points that were actually assessable */
  coverage: number;
};

export type CardTier = 'bronze' | 'silver' | 'gold' | 'elite';
export type Confidence = 'low' | 'medium' | 'high';

export type RollUp = {
  results: IndicatorResult[];
  /** the same card rating the kpi sheet computes, to the point */
  rating: number | null;
  coverage: number;
  confidence: Confidence;
  tier: CardTier | null;
  /** below 60% coverage the card must say so rather than imply certainty */
  provisional: boolean;
};

export function cardTierFor(rating: number): CardTier {
  if (rating >= 85) return 'elite';
  if (rating >= 75) return 'gold';
  if (rating >= 65) return 'silver';
  return 'bronze';
}

export function confidenceFor(coverage: number): Confidence {
  if (coverage >= 0.8) return 'high';
  if (coverage >= 0.6) return 'medium';
  return 'low';
}

/**
 * achieved = Σ(score × allocated points) / 10
 * possible = Σ(allocated points) over the kpis that were actually scored
 * indicator = achieved / possible × 100, or null when possible is 0
 *
 * the rating is the same fraction taken over all six at once, which is why it
 * matches the card rating on the kpi sheet exactly rather than approximately —
 * it is not an average of the six indicators, which would silently reweight
 * them by nothing more than how much of each happened to be visible.
 */
export function rollUp(scores: Scores, tier: Tier): RollUp | null {
  const shares = SHARES[tier];
  if (!shares) return null;

  const achieved = [0, 0, 0, 0, 0, 0];
  const possible = [0, 0, 0, 0, 0, 0];
  const total = [0, 0, 0, 0, 0, 0];

  for (const section of SHEETS[tier].sections) {
    for (const kpi of section.kpis) {
      const share = shares[kpi.id];
      if (!share) continue;
      const raw = scores[kpi.id];
      const scored = raw !== null && raw !== undefined;
      for (let i = 0; i < 6; i++) {
        const alloc = kpi.pts * share[i];
        total[i] += alloc;
        achieved[i] += ((scored ? raw! : 0) * alloc) / 10;
        if (scored) possible[i] += alloc;
      }
    }
  }

  const results = INDICATORS.map((indicator, i) => ({
    indicator,
    score: possible[i] === 0 ? null : (achieved[i] / possible[i]) * 100,
    coverage: total[i] === 0 ? 0 : possible[i] / total[i],
  }));

  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const possibleAll = sum(possible);
  const rating = possibleAll === 0 ? null : (sum(achieved) / possibleAll) * 100;
  const coverage = sum(total) === 0 ? 0 : possibleAll / sum(total);

  return {
    results,
    rating,
    coverage,
    confidence: confidenceFor(coverage),
    tier: rating === null ? null : cardTierFor(rating),
    provisional: coverage < 0.6,
  };
}
