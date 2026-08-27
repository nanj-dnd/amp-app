import type { Report } from './report';

/**
 * a scored session against the pace sheet. observations carry the frame they
 * were read from, in the model's own voice — this is the shape a real analysis
 * returns, so the ui is built against it rather than against a summary.
 */
export const currentReport: Report = {
  id: 'r-2',
  date: 'aug 26',
  discipline: 'batting',
  mode: 'pace',
  ageYears: 17,
  strengthId: 'follow-through-extension-balance',
  priorityId: 'contact-point-under-the-eyes',
  history: [65, 62, 61, 61, 64, 66],
  notes:
    'Committed stride and a free follow-through are real strengths. The one thing holding the score down is the contact point — you are reaching for the ball instead of letting it come to you.',
  drills: [
    {
      name: 'shadow drive to a cone',
      cue: 'brush the cone, arms stay bent',
      how: 'Cone at knee height, 30cm in front of your lead foot. Shadow drive and brush it with the inside edge. The arms should only extend after the ball would have been struck.',
    },
    {
      name: 'tee contact-point drill',
      cue: 'hands close, ten off the tee',
      how: 'Tee at hip height, just inside your front knee. Ten balls, hands close to the body at contact. Knock the tee sideways and you reached.',
    },
    {
      name: 'balanced finish hold',
      cue: 'hold the finish for three',
      how: 'Hold your finish position for a count of three after every shot. If you topple, narrow your base and keep your head over your centre of gravity.',
    },
  ],

  screening: [
    {
      id: 'front-knee',
      area: 'front knee',
      level: 'watch',
      evidence: 'frame 23',
      note: 'Knee braces late, so the joint takes the load instead of the hip.',
    },
    {
      id: 'spine',
      area: 'trunk',
      level: 'watch',
      evidence: 'frame 27',
      note: 'Torso leans back through the finish, loading the lower back.',
    },
    { id: 'shoulder', area: 'lead shoulder', level: 'clear', note: 'Free through the swing, no early separation.' },
    { id: 'base', area: 'base', level: 'clear', note: 'Feet stay under you at the finish.' },
  ],
  ratings: [
    {
      kpiId: 'balanced-stance-weight-distribution',
      score: 7,
      view: 'side',
      evidence: 'frame 4',
      observation:
        'Frame 4 shows a stable base with weight evenly distributed and the feet a comfortable width apart at guard.',
    },
    {
      kpiId: 'head-position-stillness-at-guard',
      score: 8,
      view: 'front',
      evidence: 'frame 6',
      observation:
        'Frame 6 shows the head still and level through the bowler’s approach, with the eyes tracking from the hand.',
    },
    {
      kpiId: 'bat-position-at-guard',
      score: 6,
      view: 'side',
      evidence: 'frame 4',
      observation: 'Frame 4 shows the bat grounded but angled slightly across, rather than square behind the toe.',
    },

    {
      kpiId: 'backlift-height-timing-vs-pace',
      score: 6,
      view: 'side',
      evidence: 'frame 12',
      observation:
        'Frame 12 shows the backlift reaching roughly hip height as the bowler loads — present and on time, but low for this pace.',
    },
    {
      kpiId: 'backlift-direction',
      score: 5,
      view: 'behind',
      evidence: 'frame 13',
      observation:
        'Frame 13 shows the bat lifting toward second slip rather than over off stump, which opens the face on the way down.',
    },

    {
      kpiId: 'front-foot-initiation-decisiveness-vs-pace',
      score: 7,
      view: 'side',
      evidence: 'frame 18',
      observation: 'Frame 18 shows a clear, committed forward press with the stride starting before the ball pitches.',
    },
    {
      kpiId: 'front-foot-landing-direction',
      score: 6,
      view: 'side',
      evidence: 'frame 21',
      observation:
        'Frame 21 shows the front foot landing slightly across the line rather than straight down the pitch, closing the hips a little early.',
    },
    {
      kpiId: 'head-weight-over-the-front-knee-at-contact',
      score: 4,
      view: 'side',
      evidence: 'frame 23',
      observation:
        'Frame 23 shows the head behind the front knee at contact, with weight still on the back half rather than travelling into the shot.',
    },

    { kpiId: 'back-foot-initiation-decisiveness-vs-pace', score: null, observation: 'No back-foot deliveries in this session.' },
    { kpiId: 'depth-balance-of-back-foot-movement', score: null, observation: 'No back-foot deliveries in this session.' },
    { kpiId: 'weight-transfer-into-the-shot-vs-pace', score: null, observation: 'No back-foot deliveries in this session.' },

    {
      kpiId: 'bat-face-control-at-contact',
      score: 7,
      view: 'behind',
      evidence: 'frame 23',
      observation: 'Frame 23 shows a roughly straight face at impact with no obvious opening or closing through contact.',
    },
    {
      kpiId: 'contact-point-under-the-eyes',
      score: 5,
      view: 'side',
      evidence: 'frame 23',
      observation:
        'Frame 23 shows the bat meeting the ball with the arms somewhat extended away from the body — the contact point is a noticeable distance from the torso rather than tucked in, suggesting the player is reaching.',
    },
    {
      kpiId: 'top-hand-control-vs-bottom-hand-dominance',
      score: 6,
      view: 'front',
      evidence: 'frame 20',
      observation:
        'Frame 20 shows the bat angle suggesting some top-hand involvement, but from the front the wrist roll and hand dominance cannot be confidently separated; no obvious early bottom-hand roll is visible.',
    },
    {
      kpiId: 'response-to-short-pitched-bowling',
      score: null,
      observation: 'No short or bouncer-length ball appeared in this session.',
    },

    {
      kpiId: 'follow-through-extension-balance',
      score: 8,
      view: 'front',
      evidence: 'frame 27',
      observation:
        'Frame 27 shows the bat swung through to a high follow-through well above the shoulders with the arms extending upward, indicating a good, uninhibited follow-through rather than a checked shot.',
    },
    {
      kpiId: 'head-stability-through-shot',
      score: 6,
      view: 'front',
      evidence: 'frame 27',
      observation:
        'Frame 27 shows the batter on both feet at the finish, but the torso has rotated and leaned back slightly; balance is maintained, not perfectly controlled.',
    },

    {
      kpiId: 'length-line-judgement-under-pace',
      score: 6,
      view: 'side',
      evidence: 'frame 16',
      observation:
        'Frame 16 shows a committed forward decision on a ball that was closer to a length than a half-volley — playable, but the length was read slightly full.',
    },
    {
      kpiId: 'consistency-across-session',
      score: 7,
      view: 'side',
      observation: 'Setup and stride repeat closely across the clips; the contact point is where the variation shows.',
    },
  ],
};

/** the session before, so the report can show what moved. */
export const previousReport: Report = {
  ...currentReport,
  id: 'r-1',
  date: 'aug 16',
  history: currentReport.history.slice(0, -1),
  ratings: currentReport.ratings.map((r) => {
    const bump: Record<string, number> = {
      'head-weight-over-the-front-knee-at-contact': 3,
      'contact-point-under-the-eyes': 6,
      'backlift-direction': 6,
      'follow-through-extension-balance': 7,
      'consistency-across-session': 6,
      'front-foot-initiation-decisiveness-vs-pace': 6,
    };
    return r.kpiId in bump ? { ...r, score: bump[r.kpiId] } : r;
  }),
};
