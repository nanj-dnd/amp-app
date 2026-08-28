import type { Progression } from './state/types';
import { cardTierFor, type CardTier } from './indicators';
import type { MetalId } from './theme';

/**
 * badges, derived rather than stored.
 *
 * nothing here is a flag the app sets — every badge is a question asked of the
 * progression on render. that means they cannot drift out of sync with the
 * thing they claim to describe, and a reset clears them for free.
 *
 * a badge carries its own metal. the four tier badges wear the metal they are
 * named after; everything else wears amp's own. locked badges wear none at
 * all — an unearned badge is an absence of metal, which is a much better
 * signal than a greyed-out copy of one.
 */

export type BadgeFamily = 'sessions' | 'tier' | 'form' | 'streak';

export type BadgeDef = {
  id: string;
  family: BadgeFamily;
  label: string;
  /** one line, present tense, said to the athlete */
  description: string;
  /** ionicons name, or a numeral printed in the disc instead */
  icon?: string;
  numeral?: string;
  unit: string;
  /** what it is made of once earned */
  metal: MetalId;
};

export type Badge = BadgeDef & {
  earned: boolean;
  /** progress toward a locked badge; have >= need once earned */
  have: number;
  need: number;
};

/**
 * the tier names come from the card model, not the mockup — that had
 * silver/gold/platinum/elite, while the workbook that actually computes a tier
 * has bronze/silver/gold/elite at 65/75/85. two ladders for one idea is how a
 * player ends up "platinum" on a card that has never heard of platinum.
 */
const TIER_AT: Record<CardTier, number> = { bronze: 0, silver: 65, gold: 75, elite: 85 };

const SESSION_AT = [1, 5, 10, 25, 50];
const STREAK_AT = [3, 7, 30];

export const BADGES: BadgeDef[] = [
  ...SESSION_AT.map((n) => ({
    id: `sessions-${n}`,
    family: 'sessions' as const,
    label: n === 1 ? 'first session' : `${n} sessions`,
    description: n === 1 ? 'filmed and scored your first session' : `filmed and scored ${n} sessions`,
    ...(n === 1 ? { icon: 'film-outline' } : { numeral: String(n) }),
    unit: 'sessions',
    metal: 'brand' as const,
  })),
  ...(['bronze', 'silver', 'gold', 'elite'] as CardTier[]).map((t) => ({
    id: `tier-${t}`,
    family: 'tier' as const,
    label: t,
    description: TIER_AT[t] === 0 ? 'scored a first rating' : `reached a card rating of ${TIER_AT[t]}`,
    icon: 'trophy-outline',
    unit: 'pts',
    metal: t as MetalId,
  })),
  {
    id: 'personal-best',
    family: 'form',
    label: 'personal best',
    description: 'your latest session is your best one yet',
    icon: 'ribbon-outline',
    unit: '',
    metal: 'gold',
  },
  {
    id: 'most-improved',
    family: 'form',
    label: 'most improved',
    description: 'climbed 10 points above where you started',
    icon: 'trending-up-outline',
    unit: 'pts',
    metal: 'brand',
  },
  ...STREAK_AT.map((n) => ({
    id: `streak-${n}`,
    family: 'streak' as const,
    label: `${n}-day streak`,
    description: `${n} days of game iq without missing one`,
    icon: 'flame-outline',
    unit: 'days',
    metal: 'brand' as const,
  })),
];

/**
 * a badge is earned on the athlete's *best*, never their latest. a rating that
 * dips the week after does not take the badge back — earning something and
 * then watching it disappear is the fastest way to stop trying.
 */
export function badgesFor(p: Progression): Badge[] {
  const scores = p.history.map((h) => h.score).filter((s) => s > 0);
  const sessions = p.history.length;
  const best = scores.length ? Math.max(...scores) : 0;
  const first = scores.length ? scores[0] : 0;
  const latest = scores.length ? scores[scores.length - 1] : 0;

  return BADGES.map((b) => {
    if (b.family === 'sessions') {
      const need = Number(b.id.split('-')[1]);
      return { ...b, earned: sessions >= need, have: sessions, need };
    }
    if (b.family === 'tier') {
      const tier = b.label as CardTier;
      const need = TIER_AT[tier];
      // bronze needs a rating at all, not a rating of zero
      const earned = best > 0 && cardTierFor(best) !== null && best >= need;
      return { ...b, earned, have: best, need: Math.max(need, 1) };
    }
    if (b.id === 'personal-best') {
      return { ...b, earned: scores.length >= 2 && latest === best, have: latest, need: best || 1 };
    }
    if (b.id === 'most-improved') {
      const gained = Math.max(0, best - first);
      return { ...b, earned: scores.length >= 2 && gained >= 10, have: gained, need: 10 };
    }
    const need = Number(b.id.split('-')[1]);
    return { ...b, earned: p.streak >= need, have: p.streak, need };
  });
}

export const earnedCount = (list: Badge[]) => list.filter((b) => b.earned).length;
