/**
 * amp's batting kpi sheets, generated from amp_batting_male_all_tiers.xlsx.
 *
 * three things about this structure matter downstream:
 *   • kpis are weighted and grouped into weighted sections, both summing to 100
 *   • "applies" gates a kpi to front-foot, back-foot or conditional deliveries
 *   • a kpi that wasn't observed is BLANK, never 0 — rescale() drops it from
 *     both sides of the fraction so an unseen shot can't tank a rating
 */

export type Tier = 'foundation' | 'development' | 'pace' | 'spin';
export type Applies = 'both' | 'front-foot' | 'back-foot' | 'conditional';

export type Kpi = { id: string; name: string; pts: number; applies: Applies };
export type Section = { id: string; name: string; pts: number; kpis: Kpi[] };
export type TierSheet = { key: Tier; label: string; ages: string; blurb: string; sections: Section[] };

export const SHEETS: Record<Tier, TierSheet> = {
  foundation: {
    key: 'foundation',
    label: 'foundation',
    ages: '~5-9',
    blurb: 'effort over technique. seven checks, scored simply.',
    sections: [
      {
        id: 'setup-watching-the-ball',
        name: 'setup & watching the ball',
        pts: 30,
        kpis: [
          { id: 'basic-stance-grip', name: 'basic stance & grip', pts: 10, applies: 'both' },
          { id: 'watching-the-ball', name: 'watching the ball', pts: 10, applies: 'both' },
          { id: 'positive-attempt', name: 'positive attempt', pts: 10, applies: 'both' },
        ],
      },
      {
        id: 'movement',
        name: 'movement',
        pts: 20,
        kpis: [
          { id: 'moving-feet-toward-the-ball', name: 'moving feet toward the ball', pts: 20, applies: 'both' },
        ],
      },
      {
        id: 'bat-swing-contact',
        name: 'bat swing & contact',
        pts: 30,
        kpis: [
          { id: 'bat-swing-through-the-line', name: 'bat swing through the line', pts: 15, applies: 'both' },
          { id: 'contact-attempt-quality', name: 'contact attempt quality', pts: 15, applies: 'both' },
        ],
      },
      {
        id: 'finish',
        name: 'finish',
        pts: 20,
        kpis: [
          { id: 'balance-at-finish', name: 'balance at finish', pts: 20, applies: 'both' },
        ],
      },
    ],
  },
  development: {
    key: 'development',
    label: 'development',
    ages: '~9-13',
    blurb: 'twelve checks, with a light front-foot / back-foot split.',
    sections: [
      {
        id: 'stance-setup',
        name: 'stance & setup',
        pts: 12,
        kpis: [
          { id: 'balanced-stance-grip', name: 'balanced stance & grip', pts: 6, applies: 'both' },
          { id: 'head-position-watching-the-ball', name: 'head position & watching the ball', pts: 6, applies: 'both' },
        ],
      },
      {
        id: 'backlift',
        name: 'backlift',
        pts: 10,
        kpis: [
          { id: 'backlift-height-timing', name: 'backlift height & timing', pts: 10, applies: 'both' },
        ],
      },
      {
        id: 'moving-forward',
        name: 'moving forward',
        pts: 14,
        kpis: [
          { id: 'decisive-forward-movement', name: 'decisive forward movement', pts: 14, applies: 'front-foot' },
        ],
      },
      {
        id: 'moving-back',
        name: 'moving back',
        pts: 14,
        kpis: [
          { id: 'decisive-backward-movement', name: 'decisive backward movement', pts: 14, applies: 'back-foot' },
        ],
      },
      {
        id: 'bat-path-contact',
        name: 'bat path & contact',
        pts: 24,
        kpis: [
          { id: 'bat-face-control-at-contact', name: 'bat face control at contact', pts: 8, applies: 'both' },
          { id: 'contact-point-near-the-body', name: 'contact point near the body', pts: 8, applies: 'both' },
          { id: 'top-hand-control', name: 'top-hand control', pts: 8, applies: 'both' },
        ],
      },
      {
        id: 'follow-through-balance',
        name: 'follow through & balance',
        pts: 12,
        kpis: [
          { id: 'follow-through-extension', name: 'follow through extension', pts: 6, applies: 'both' },
          { id: 'balance-at-completion', name: 'balance at completion', pts: 6, applies: 'both' },
        ],
      },
      {
        id: 'shot-awareness',
        name: 'shot awareness',
        pts: 14,
        kpis: [
          { id: 'reasonable-shot-choice-for-the-ball', name: 'reasonable shot choice for the ball', pts: 7, applies: 'both' },
          { id: 'consistency-repeatable-technique', name: 'consistency / repeatable technique', pts: 7, applies: 'both' },
        ],
      },
    ],
  },
  pace: {
    key: 'pace',
    label: 'pace',
    ages: '15+',
    blurb: 'the full sheet, scored against pace bowling.',
    sections: [
      {
        id: 'stance-setup',
        name: 'stance & setup',
        pts: 10,
        kpis: [
          { id: 'balanced-stance-weight-distribution', name: 'balanced stance & weight distribution', pts: 4, applies: 'both' },
          { id: 'head-position-stillness-at-guard', name: 'head position & stillness at guard', pts: 3, applies: 'both' },
          { id: 'bat-position-at-guard', name: 'bat position at guard', pts: 3, applies: 'both' },
        ],
      },
      {
        id: 'backlift',
        name: 'backlift',
        pts: 10,
        kpis: [
          { id: 'backlift-height-timing-vs-pace', name: 'backlift height & timing vs pace', pts: 5, applies: 'both' },
          { id: 'backlift-direction', name: 'backlift direction', pts: 5, applies: 'both' },
        ],
      },
      {
        id: 'footwork-front-foot-deliveries-only',
        name: 'footwork: front-foot deliveries only',
        pts: 20,
        kpis: [
          { id: 'front-foot-initiation-decisiveness-vs-pace', name: 'front foot initiation & decisiveness vs pace', pts: 7, applies: 'front-foot' },
          { id: 'front-foot-landing-direction', name: 'front foot landing direction', pts: 7, applies: 'front-foot' },
          { id: 'head-weight-over-the-front-knee-at-contact', name: 'head & weight over the front knee at contact', pts: 6, applies: 'front-foot' },
        ],
      },
      {
        id: 'footwork-back-foot-deliveries-only',
        name: 'footwork: back-foot deliveries only',
        pts: 20,
        kpis: [
          { id: 'back-foot-initiation-decisiveness-vs-pace', name: 'back foot initiation & decisiveness vs pace', pts: 7, applies: 'back-foot' },
          { id: 'depth-balance-of-back-foot-movement', name: 'depth & balance of back foot movement', pts: 7, applies: 'back-foot' },
          { id: 'weight-transfer-into-the-shot-vs-pace', name: 'weight transfer into the shot vs pace', pts: 6, applies: 'back-foot' },
        ],
      },
      {
        id: 'bat-path-contact-pace-specific',
        name: 'bat path & contact (pace-specific)',
        pts: 22,
        kpis: [
          { id: 'bat-face-control-at-contact', name: 'bat face control at contact', pts: 6, applies: 'both' },
          { id: 'contact-point-under-the-eyes', name: 'contact point — under the eyes', pts: 6, applies: 'both' },
          { id: 'top-hand-control-vs-bottom-hand-dominance', name: 'top-hand control vs bottom-hand dominance', pts: 5, applies: 'both' },
          { id: 'response-to-short-pitched-bowling', name: 'response to short-pitched bowling', pts: 5, applies: 'conditional' },
        ],
      },
      {
        id: 'follow-through',
        name: 'follow through',
        pts: 8,
        kpis: [
          { id: 'follow-through-extension-balance', name: 'follow through extension & balance', pts: 4, applies: 'both' },
          { id: 'head-stability-through-shot', name: 'head stability through shot', pts: 4, applies: 'both' },
        ],
      },
      {
        id: 'shot-intelligence-pace-specific',
        name: 'shot intelligence (pace-specific)',
        pts: 10,
        kpis: [
          { id: 'length-line-judgement-under-pace', name: 'length & line judgement under pace', pts: 5, applies: 'both' },
          { id: 'consistency-across-session', name: 'consistency across session', pts: 5, applies: 'both' },
        ],
      },
    ],
  },
  spin: {
    key: 'spin',
    label: 'spin',
    ages: '15+',
    blurb: 'the full sheet, scored against spin.',
    sections: [
      {
        id: 'stance-setup',
        name: 'stance & setup',
        pts: 9,
        kpis: [
          { id: 'balanced-stance-readiness', name: 'balanced stance & readiness', pts: 3, applies: 'both' },
          { id: 'head-position-watching-the-hand', name: 'head position & watching the hand', pts: 3, applies: 'both' },
          { id: 'bat-position-at-guard', name: 'bat position at guard', pts: 3, applies: 'both' },
        ],
      },
      {
        id: 'backlift',
        name: 'backlift',
        pts: 9,
        kpis: [
          { id: 'backlift-height-timing-vs-spin', name: 'backlift height & timing vs spin', pts: 5, applies: 'both' },
          { id: 'backlift-direction', name: 'backlift direction', pts: 4, applies: 'both' },
        ],
      },
      {
        id: 'footwork-advancing-front-foot-deliveries-only',
        name: 'footwork: advancing / front-foot deliveries only',
        pts: 20,
        kpis: [
          { id: 'decisive-advance-to-the-pitch-of-the-ball', name: 'decisive advance to the pitch of the ball', pts: 7, applies: 'front-foot' },
          { id: 'front-foot-landing-at-or-beyond-the-pitch-of-the-ball', name: 'front foot landing at or beyond the pitch of the ball', pts: 7, applies: 'front-foot' },
          { id: 'weight-transfer-forward-through-the-shot', name: 'weight transfer forward through the shot', pts: 6, applies: 'front-foot' },
        ],
      },
      {
        id: 'footwork-back-foot-deep-deliveries-only',
        name: 'footwork: back-foot / deep deliveries only',
        pts: 20,
        kpis: [
          { id: 'decisive-back-across-depth-of-movement', name: 'decisive back & across / depth of movement', pts: 7, applies: 'back-foot' },
          { id: 'balance-weight-transfer-into-the-shot-spin', name: 'balance & weight transfer into the shot (spin)', pts: 7, applies: 'back-foot' },
          { id: 'cut-pull-shot-control-off-the-back-foot', name: 'cut/pull shot control off the back foot', pts: 6, applies: 'back-foot' },
        ],
      },
      {
        id: 'bat-path-contact-spin-specific',
        name: 'bat path & contact (spin-specific)',
        pts: 15,
        kpis: [
          { id: 'playing-with-the-spin', name: 'playing with the spin', pts: 5, applies: 'both' },
          { id: 'soft-hands-controlled-bat-speed-into-contact', name: 'soft hands / controlled bat speed into contact', pts: 5, applies: 'both' },
          { id: 'late-contact-playing-the-ball-off-the-pitch', name: 'late contact — playing the ball off the pitch', pts: 5, applies: 'both' },
        ],
      },
      {
        id: 'sweep-shot-execution',
        name: 'sweep shot execution',
        pts: 9,
        kpis: [
          { id: 'front-knee-drop-head-position-over-the-ball', name: 'front knee drop & head position over the ball', pts: 5, applies: 'conditional' },
          { id: 'contact-point-in-front-of-the-stumps', name: 'contact point in front of the stumps', pts: 4, applies: 'conditional' },
        ],
      },
      {
        id: 'follow-through',
        name: 'follow through',
        pts: 8,
        kpis: [
          { id: 'follow-through-extension-balance', name: 'follow through extension & balance', pts: 4, applies: 'both' },
          { id: 'head-stability-through-shot', name: 'head stability through shot', pts: 4, applies: 'both' },
        ],
      },
      {
        id: 'shot-intelligence-spin-specific',
        name: 'shot intelligence (spin-specific)',
        pts: 10,
        kpis: [
          { id: 'length-turn-read-leading-to-a-decisive-front-back-call', name: 'length & turn read leading to a decisive front/back call', pts: 5, applies: 'both' },
          { id: 'consistency-across-session', name: 'consistency across session', pts: 5, applies: 'both' },
        ],
      },
    ],
  },
};

export const TIER_ORDER: Tier[] = ['foundation', 'development', 'pace', 'spin'];

/**
 * which sheet a session is scored against. age picks the tier; from 15 the
 * athlete chooses pace or spin at upload, because it changes the whole sheet
 * rather than a few rows.
 */
export function tierFor(ageYears: number, mode: 'pace' | 'spin' = 'pace'): Tier {
  if (ageYears < 9) return 'foundation';
  if (ageYears < 15) return 'development';
  return mode;
}

export type Scores = Record<string, number | null>;

export type SectionResult = {
  section: Section;
  /** 0–100, rescaled over the kpis actually observed in this section */
  score: number | null;
  /** what this section is worth on the sheet */
  weight: number;
  scored: number;
  total: number;
  kpis: { kpi: Kpi; score: number | null }[];
};

export type SheetResult = {
  tier: TierSheet;
  overall: number | null;
  sections: SectionResult[];
  observed: number;
  possible: number;
};

/**
 * rescales a set of 0–10 kpi scores into a 0–100 rating using only what was
 * actually observed. this is the whole point of blank-vs-zero: a back-foot kpi
 * on a session with no back-foot deliveries leaves both the numerator and the
 * denominator, instead of scoring nothing and dragging the rating down.
 */
export function rescale(scores: Scores, tier: Tier): SheetResult {
  const sheet = SHEETS[tier];
  let num = 0;
  let den = 0;

  const sections: SectionResult[] = sheet.sections.map((section) => {
    let sNum = 0;
    let sDen = 0;
    const kpis = section.kpis.map((kpi) => {
      const raw = scores[kpi.id];
      const score = raw === undefined || raw === null ? null : raw;
      if (score !== null) {
        sNum += (score / 10) * kpi.pts;
        sDen += kpi.pts;
      }
      return { kpi, score };
    });
    num += sNum;
    den += sDen;
    return {
      section,
      score: sDen === 0 ? null : Math.round((sNum / sDen) * 100),
      weight: section.pts,
      scored: kpis.filter((k) => k.score !== null).length,
      total: section.kpis.length,
      kpis,
    };
  });

  return {
    tier: sheet,
    overall: den === 0 ? null : Math.round((num / den) * 100),
    sections,
    observed: den,
    possible: sheet.sections.reduce((s, x) => s + x.pts, 0),
  };
}

/** every kpi across a sheet, flattened. */
export const allKpis = (tier: Tier) => SHEETS[tier].sections.flatMap((s) => s.kpis);
