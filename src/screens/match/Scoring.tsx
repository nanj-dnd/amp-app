import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../ui/Text';
import { Touch } from '../../ui/Pressable';
import { Button, IconButton } from '../../ui/Button';
import { useColors, space, radius, font } from '../../theme';
import { PickSheet } from './PickSheet';
import { ShotSheet } from './ShotSheet';
import {
  applyBall,
  undoBall,
  legalBalls,
  totalRuns,
  wickets,
  oversText,
  runRate,
  requiredRate,
  currentOverBalls,
  ballChip,
  battingCard,
  bowlingCard,
  availableBatters,
  availableBowlers,
  pendingBatter,
  replaceBatter,
  nameLookup,
  teamById,
  oversFor,
  inningsEnd,
  type BallInput,
} from '../../match/engine';
import { WICKET_KINDS, type Extra, type Match, type WicketKind } from '../../match/types';

type Pending =
  | { kind: 'bowler' }
  | { kind: 'batter'; outId: string }
  | { kind: 'wicket' }
  | { kind: 'fielder'; wicketKind: WicketKind }
  | { kind: 'detail'; input: BallInput }
  | null;

/**
 * the scoring pad. the design goal is that a full over — including a wide, a
 * boundary and a wicket — never needs more than one tap per event.
 *
 * extras are modifiers, not modes: tap `wd` and you've logged a wide for one.
 * tap `wd` then `2` and you've logged a wide that went for three. cricheroes
 * makes each of those a separate dialog.
 */
export function Scoring({
  match,
  onChange,
  onClose,
  onOpenCard,
  onInningsEnd,
}: {
  match: Match;
  onChange: (m: Match) => void;
  onClose: () => void;
  onOpenCard: () => void;
  /**
   * overs gone, all out, or the target passed. the updated match is handed over
   * rather than read from the parent's state, which has not re-rendered yet and
   * would still be missing the ball that just ended the innings.
   */
  onInningsEnd: (reason: 'overs' | 'all out' | 'chased', updated: Match) => void;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [extra, setExtra] = useState<Extra | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  const inn = match.innings[match.innings.length - 1];
  const name = useMemo(() => nameLookup(match), [match]);
  const batTeam = teamById(match, inn.battingTeamId);
  const bowlTeam = teamById(match, inn.bowlingTeamId);

  const runs = totalRuns(inn);
  const wkts = wickets(inn);
  const rrr = requiredRate(inn, match.config.overs);
  const overBalls = currentOverBalls(inn);

  const cards = battingCard(inn, batTeam);
  const strikerCard = cards.find((x) => x.playerId === inn.strikerId);
  const nonStrikerCard = cards.find((x) => x.playerId === inn.nonStrikerId);
  const bowlerCard = bowlingCard(inn).find((x) => x.playerId === inn.bowlerId);

  const commit = (next: typeof inn) => {
    const innings = [...match.innings];
    innings[innings.length - 1] = next;
    const updated = { ...match, innings };
    onChange(updated);

    // an innings can close on this ball — check before asking for a new batter,
    // because "all out" means there is nobody to ask for
    const ended = inningsEnd(next, match.config.overs, batTeam.players.length);
    if (ended) {
      setPending(null);
      return onInningsEnd(ended, updated);
    }

    const outId = pendingBatter(next);
    if (outId) setPending({ kind: 'batter', outId });
    else if (!next.bowlerId) setPending({ kind: 'bowler' });
  };

  const record = (input: BallInput) => {
    if (!inn.bowlerId) return setPending({ kind: 'bowler' });
    setExtra(null);
    // scoring shots optionally capture placement; this is the data amp actually
    // wants out of a match, so it asks — but only on shots worth plotting
    if (match.config.captureDetail && !input.extra && (input.runsOffBat ?? 0) > 0 && !input.wicket) {
      setPending({ kind: 'detail', input });
      return;
    }
    commit(applyBall(inn, input));
  };

  const tapRun = (n: number) => {
    if (extra === 'wd') return record({ extra: 'wd', extraRuns: n });
    if (extra === 'nb') return record({ extra: 'nb', runsOffBat: n });
    if (extra === 'b' || extra === 'lb') return record({ extra, extraRuns: Math.max(1, n) });
    record({ runsOffBat: n });
  };

  const tapExtra = (e: Extra) => {
    // a second tap on the same modifier logs the plain version
    if (extra === e) {
      if (e === 'wd' || e === 'nb') record({ extra: e });
      else record({ extra: e, extraRuns: 1 });
      return;
    }
    setExtra(e);
  };

  const undo = () =>
    commit(undoBall(inn, [batTeam.players[0]?.id ?? '', batTeam.players[1]?.id ?? '']));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* scoreboard */}
      <View
        style={{
          paddingTop: insets.top + space.sm,
          paddingHorizontal: space.gutter,
          paddingBottom: space.lg,
          backgroundColor: c.surface,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.hairline,
          gap: space.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <IconButton icon="chevron-down" size={32} onPress={onClose} />
          <Text variant="caption" tone="secondary" style={{ flex: 1 }} numberOfLines={1}>
            {batTeam.name}
          </Text>
          <IconButton icon="list-outline" size={32} onPress={onOpenCard} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
          <Text style={{ fontFamily: font.black, fontSize: 42, letterSpacing: -2, color: c.text }}>
            {`${runs}/${wkts}`}
          </Text>
          <Text variant="heading" tone="secondary">
            {`(${oversText(inn)})`}
          </Text>
          <View style={{ flex: 1 }} />
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="caption" tone="tertiary">
              {rrr === null ? 'crr' : 'req'}
            </Text>
            <Text variant="bodyStrong" tone={rrr === null ? 'primary' : 'brand'}>
              {(rrr ?? runRate(inn)).toFixed(2)}
            </Text>
          </View>
        </View>

        {inn.target !== undefined && (
          <Text variant="caption" tone="secondary">
            {`needs ${Math.max(0, inn.target - runs)} off ${Math.max(0, match.config.overs * 6 - legalBalls(inn))}`}
          </Text>
        )}

        {/* who's in, who's on */}
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Batter label={name(inn.strikerId)} onStrike runs={strikerCard?.runs ?? 0} balls={strikerCard?.balls ?? 0} />
          <Batter label={name(inn.nonStrikerId)} runs={nonStrikerCard?.runs ?? 0} balls={nonStrikerCard?.balls ?? 0} />
        </View>

        <Touch
          haptic="light"
          onPress={() => setPending({ kind: 'bowler' })}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.sm,
            paddingVertical: space.sm,
            paddingHorizontal: space.md,
            borderRadius: radius.sm,
            backgroundColor: c.fill,
          }}
        >
          <Ionicons name="tennisball-outline" size={15} color={c.textSecondary} />
          <Text variant="callout" style={{ flex: 1 }}>
            {inn.bowlerId ? name(inn.bowlerId) : 'choose a bowler'}
          </Text>
          {bowlerCard && (
            <Text variant="caption" tone="tertiary" style={{ fontFamily: font.bold }}>
              {`${oversFor(bowlerCard.balls)}-${bowlerCard.maidens}-${bowlerCard.runs}-${bowlerCard.wickets}`}
            </Text>
          )}
        </Touch>

        {/* this over */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 28 }}>
          <Text variant="tab" tone="tertiary" style={{ width: 46 }}>
            this over
          </Text>
          {overBalls.length === 0 && (
            <Text variant="caption" tone="tertiary">
              —
            </Text>
          )}
          {overBalls.map((b) => {
            const chip = ballChip(b);
            const tone = b.wicket
              ? c.score.poor
              : b.extra
                ? c.score.fair
                : b.runsOffBat >= 4
                  ? c.brand
                  : c.textSecondary;
            return (
              <View
                key={b.id}
                style={{
                  minWidth: 26,
                  height: 26,
                  paddingHorizontal: 5,
                  borderRadius: 13,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: tone + '22',
                }}
              >
                <Text variant="tab" color={tone} style={{ fontFamily: font.bold }}>
                  {chip}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} />

      {/* the pad */}
      <View
        style={{
          paddingHorizontal: space.gutter,
          paddingTop: space.md,
          paddingBottom: Math.max(insets.bottom, space.md),
          gap: space.sm,
          backgroundColor: c.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: c.hairline,
        }}
      >
        {extra && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Text variant="caption" tone="brand" style={{ flex: 1, fontFamily: font.bold }}>
              {extra === 'wd'
                ? 'wide — tap a number for runs run, or wd again for just the wide'
                : extra === 'nb'
                  ? 'no ball — tap the runs off the bat'
                  : `${extra === 'b' ? 'byes' : 'leg byes'} — tap how many`}
            </Text>
            <Touch scale={false} haptic="light" onPress={() => setExtra(null)} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color={c.textTertiary} />
            </Touch>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {[0, 1, 2, 3].map((n) => (
            <Key key={n} label={String(n)} onPress={() => tapRun(n)} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Key label="4" big onPress={() => tapRun(4)} />
          <Key label="6" big onPress={() => tapRun(6)} />
          <Key label="5" onPress={() => tapRun(5)} />
          <Key
            label="out"
            tone="danger"
            onPress={() => (inn.bowlerId ? setPending({ kind: 'wicket' }) : setPending({ kind: 'bowler' }))}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {(['wd', 'nb', 'b', 'lb'] as Extra[]).map((e) => (
            <Key key={e} label={e} small active={extra === e} onPress={() => tapExtra(e)} />
          ))}
          <Key label="undo" small tone="muted" onPress={undo} disabled={inn.balls.length === 0} />
        </View>
      </View>

      {/* sheets */}
      {pending?.kind === 'bowler' && (
        <PickSheet
          title="who's bowling?"
          subtitle={bowlTeam.name}
          options={availableBowlers(inn, bowlTeam, match.config.oversPerBowler).map((p) => {
            const card = bowlingCard(inn).find((x) => x.playerId === p.id);
            return {
              id: p.id,
              label: p.name,
              meta: card ? `${oversFor(card.balls)}-${card.maidens}-${card.runs}-${card.wickets}` : undefined,
            };
          })}
          onPick={(id) => {
            const innings = [...match.innings];
            innings[innings.length - 1] = { ...inn, bowlerId: id };
            onChange({ ...match, innings });
            setPending(null);
          }}
          onClose={() => setPending(null)}
        />
      )}

      {pending?.kind === 'batter' && (
        <PickSheet
          title="who's in?"
          subtitle={`${name(pending.outId)} is out`}
          options={availableBatters(inn, batTeam).map((p) => ({ id: p.id, label: p.name }))}
          onPick={(id) => {
            const next = replaceBatter(inn, pending.outId, id);
            const innings = [...match.innings];
            innings[innings.length - 1] = next;
            onChange({ ...match, innings });
            setPending(next.bowlerId ? null : { kind: 'bowler' });
          }}
          onClose={() => setPending(null)}
        />
      )}

      {pending?.kind === 'wicket' && (
        <PickSheet
          title="how out?"
          options={WICKET_KINDS.map((k) => ({ id: k, label: k }))}
          onPick={(k) => {
            const kind = k as WicketKind;
            // these need a fielder; run out also needs to say which batter
            if (kind === 'caught' || kind === 'stumped' || kind === 'run out') {
              setPending({ kind: 'fielder', wicketKind: kind });
            } else {
              setPending(null);
              record({ wicket: { kind, outId: inn.strikerId } });
            }
          }}
          onClose={() => setPending(null)}
        />
      )}

      {pending?.kind === 'fielder' && (
        <PickSheet
          title={pending.wicketKind === 'run out' ? 'who threw?' : 'caught by?'}
          subtitle={bowlTeam.name}
          options={bowlTeam.players.map((p) => ({ id: p.id, label: p.name }))}
          extraAction={
            pending.wicketKind === 'run out'
              ? { label: `run out at the non-striker's end (${name(inn.nonStrikerId)})`, id: '__nonstriker' }
              : undefined
          }
          onPick={(fielderId) => {
            const nonStriker = fielderId === '__nonstriker';
            setPending(null);
            record({
              wicket: {
                kind: pending.wicketKind,
                outId: nonStriker ? inn.nonStrikerId : inn.strikerId,
                fielderId: nonStriker ? undefined : fielderId,
              },
            });
          }}
          onClose={() => setPending(null)}
        />
      )}

      {pending?.kind === 'detail' && (
        <ShotSheet
          runs={pending.input.runsOffBat ?? 0}
          hand={batTeam.players.find((p) => p.id === inn.strikerId)?.battingHand ?? 'right'}
          onDone={(shot, region) => {
            const input = { ...pending.input, shot, region };
            setPending(null);
            commit(applyBall(inn, input));
          }}
          onSkip={() => {
            const input = pending.input;
            setPending(null);
            commit(applyBall(inn, input));
          }}
        />
      )}
    </View>
  );
}

function Batter({ label, runs, balls, onStrike }: { label: string; runs: number; balls: number; onStrike?: boolean }) {
  const c = useColors();
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: space.sm,
        paddingHorizontal: space.md,
        borderRadius: radius.sm,
        backgroundColor: onStrike ? c.brandTint : c.fill,
      }}
    >
      {onStrike && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.brand }} />}
      <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>
        {label}
      </Text>
      <Text variant="caption" style={{ fontFamily: font.bold }}>
        {`${runs}`}
      </Text>
      <Text variant="tab" tone="tertiary">
        {`(${balls})`}
      </Text>
    </View>
  );
}

function Key({
  label,
  onPress,
  big,
  small,
  tone,
  active,
  disabled,
}: {
  label: string;
  onPress: () => void;
  big?: boolean;
  small?: boolean;
  tone?: 'danger' | 'muted';
  active?: boolean;
  disabled?: boolean;
}) {
  const c = useColors();
  const bg = active ? c.brand : tone === 'danger' ? c.dangerTint : tone === 'muted' ? c.fill : c.fill;
  const fg = active ? c.textOnBrand : tone === 'danger' ? c.danger : tone === 'muted' ? c.textSecondary : c.text;

  return (
    <Touch
      haptic={tone === 'danger' ? 'medium' : 'light'}
      onPress={onPress}
      disabled={disabled}
      style={{
        flex: big ? 1.35 : 1,
        height: small ? 44 : 54,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: big && !active ? c.brandTint : bg,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Text
        style={{
          fontFamily: font.black,
          fontSize: small ? 14 : big ? 24 : 20,
          letterSpacing: -0.4,
          color: big && !active ? c.brand : fg,
        }}
      >
        {label}
      </Text>
    </Touch>
  );
}
