import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../ui/Text';
import { MetalFill } from '../../ui/Metal';
import { Touch } from '../../ui/Pressable';
import { Button } from '../../ui/Button';
import { Segmented } from '../../ui/Segmented';
import { useColors, space, radius, font, METALS } from '../../theme';
import { Header, Footer, TeamInput } from './Setup';
import { PickSheet } from './PickSheet';
import { Sheet } from '../../ui/Sheet';
import type { Match, Player, Team } from '../../match/types';

/**
 * squads and roles on one screen. cricheroes splits "select playing XI",
 * "captain" and "wicket keeper" across three pushes; here the captain and
 * keeper are chips on the player row, because they are properties of a player,
 * not separate lists.
 */
export function Squads({ match, onDone, onClose }: { match: Match; onDone: (m: Match) => void; onClose: () => void }) {
  const c = useColors();
  const [side, setSide] = useState<0 | 1>(0);
  const [teams, setTeams] = useState<[Team, Team]>(match.teams);
  const [draft, setDraft] = useState('');
  const [athleteId, setAthleteId] = useState<string | undefined>(match.athletePlayerId);
  const [pickingMe, setPickingMe] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);

  const everyone = [...teams[0].players, ...teams[1].players];
  const me = everyone.find((p) => p.id === athleteId);

  const team = teams[side];
  const setTeam = (t: Team) => setTeams((prev) => (side === 0 ? [t, prev[1]] : [prev[0], t]) as [Team, Team]);

  const add = () => {
    const name = draft.trim();
    if (name.length < 2) return;
    const p: Player = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name,
      battingHand: 'right',
      bowlingArm: 'right',
    };
    setTeam({ ...team, players: [...team.players, p] });
    setDraft('');
  };

  const enough = teams[0].players.length >= 2 && teams[1].players.length >= 2;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Header title="squads" onClose={onClose} />

      <View style={{ padding: space.gutter, paddingBottom: space.md }}>
        <Segmented
          value={String(side)}
          onChange={(v) => setSide(Number(v) as 0 | 1)}
          options={[
            { value: '0', label: teams[0].name || 'home' },
            { value: '1', label: teams[1].name || 'away' },
          ]}
        />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: space.gutter, paddingBottom: space.xxxl, gap: space.sm }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.sm }}>
            <View style={{ flex: 1 }}>
              <TeamInput value={draft} onChange={setDraft} placeholder="add a player" />
            </View>
            <Touch
              haptic="light"
              onPress={add}
              style={{
                width: 46,
                height: 46,
                borderRadius: radius.md,
                backgroundColor: METALS.brand.base,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MetalFill metal="brand" />
              <Ionicons name="add" size={22} color={METALS.brand.ink} />
            </Touch>
          </View>

          {team.players.length === 0 && (
            <Text variant="callout" tone="tertiary" align="center" style={{ paddingVertical: space.xl }}>
              add batting order first — the order you add them is the order they bat.
            </Text>
          )}

          {team.players.map((p, i) => (
            <Touch
              key={p.id}
              haptic="selection"
              onPress={() => setEditing(p)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.sm,
                padding: space.md,
                paddingLeft: space.lg,
                borderRadius: radius.md,
                backgroundColor: c.surface,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: athleteId === p.id ? c.brand : c.hairline,
              }}
            >
              <Text variant="caption" tone="tertiary" style={{ width: 16, fontFamily: font.bold }}>
                {String(i + 1)}
              </Text>
              <Text variant="bodyStrong" style={{ flex: 1, minWidth: 0 }} numberOfLines={1}>
                {p.name}
              </Text>

              {/* badges only — the four toggles that used to live here didn't fit
                  next to a name, so the row opens an editor instead */}
              <Text variant="tab" tone="tertiary">
                {`${p.battingHand === 'left' ? 'lh' : 'rh'} · ${p.bowlingArm === 'left' ? 'la' : 'ra'}`}
              </Text>
              {team.captainId === p.id && <Badge label="c" />}
              {team.keeperId === p.id && <Badge label="wk" />}
              <Ionicons name="chevron-forward" size={14} color={c.textTertiary} />
            </Touch>
          ))}
        </ScrollView>

        <Footer>
          {/* naming yourself is what turns a scorecard into your own kpis */}
          <Touch
            haptic="selection"
            onPress={() => setPickingMe(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.sm,
              paddingHorizontal: space.lg,
              paddingVertical: space.md,
              borderRadius: radius.md,
              backgroundColor: me ? c.brandTint : c.fill,
            }}
          >
            <Ionicons name={me ? 'person-circle' : 'person-add-outline'} size={18} color={me ? c.brand : c.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text variant="caption" tone={me ? 'brand' : 'secondary'}>
                {me ? 'feeds your kpis' : 'which one is you?'}
              </Text>
              {me && <Text variant="callout">{me.name}</Text>}
            </View>
            <Text variant="caption" tone="tertiary">
              {me ? 'change' : 'optional'}
            </Text>
          </Touch>

          <Button
            label="toss"
            size="lg"
            full
            disabled={!enough}
            onPress={() => onDone({ ...match, teams, athletePlayerId: athleteId })}
          />
          {!enough && (
            <Text variant="caption" tone="tertiary" align="center">
              at least two players per side
            </Text>
          )}
        </Footer>
      </KeyboardAvoidingView>

      {editing && (
        <PlayerSheet
          player={editing}
          isCaptain={team.captainId === editing.id}
          isKeeper={team.keeperId === editing.id}
          onChange={(next, roles) =>
            setTeam({
              ...team,
              players: team.players.map((x) => (x.id === next.id ? next : x)),
              captainId: roles.captain ? next.id : team.captainId === next.id ? undefined : team.captainId,
              keeperId: roles.keeper ? next.id : team.keeperId === next.id ? undefined : team.keeperId,
            })
          }
          onRemove={() => {
            setTeam({ ...team, players: team.players.filter((x) => x.id !== editing.id) });
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {pickingMe && (
        <PickSheet
          title="which player are you?"
          subtitle="every ball you face or bowl feeds your amp kpis"
          options={everyone.map((p) => ({
            id: p.id,
            label: p.name,
            meta: teams[0].players.some((x) => x.id === p.id) ? teams[0].name : teams[1].name,
          }))}
          extraAction={athleteId ? { label: "i'm not playing in this one", id: '__none' } : undefined}
          onPick={(id) => {
            setAthleteId(id === '__none' ? undefined : id);
            setPickingMe(false);
          }}
          onClose={() => setPickingMe(false)}
        />
      )}
    </View>
  );
}

function Badge({ label }: { label: string }) {
  const c = useColors();
  return (
    <View
      style={{
        paddingHorizontal: 6,
        height: 20,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: METALS.brand.base,
        overflow: 'hidden',
      }}
    >
      <MetalFill metal="brand" />
      <Text variant="tab" color={METALS.brand.ink} style={{ fontFamily: font.bold }}>
        {label}
      </Text>
    </View>
  );
}

/** everything about one player, in one sheet. */
function PlayerSheet({
  player,
  isCaptain,
  isKeeper,
  onChange,
  onRemove,
  onClose,
}: {
  player: Player;
  isCaptain: boolean;
  isKeeper: boolean;
  onChange: (p: Player, roles: { captain: boolean; keeper: boolean }) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const c = useColors();
  const [p, setP] = useState(player);
  const [captain, setCaptain] = useState(isCaptain);
  const [keeper, setKeeper] = useState(isKeeper);

  const commit = (next: Player, cap = captain, kp = keeper) => {
    setP(next);
    onChange(next, { captain: cap, keeper: kp });
  };

  return (
    <Sheet onClose={onClose}>
      <Text variant="title">{p.name}</Text>

        <Field label="bats">
          <Segmented
            value={p.battingHand ?? 'right'}
            onChange={(battingHand) => commit({ ...p, battingHand })}
            options={[
              { value: 'right', label: 'right hand' },
              { value: 'left', label: 'left hand' },
            ]}
          />
        </Field>

        <Field label="bowls">
          <Segmented
            value={p.bowlingArm ?? 'right'}
            onChange={(bowlingArm) => commit({ ...p, bowlingArm })}
            options={[
              { value: 'right', label: 'right arm' },
              { value: 'left', label: 'left arm' },
            ]}
          />
        </Field>

        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Toggle label="captain" on={captain} onPress={() => { setCaptain(!captain); commit(p, !captain, keeper); }} />
          <Toggle label="keeper" on={keeper} onPress={() => { setKeeper(!keeper); commit(p, captain, !keeper); }} />
        </View>

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <View style={{ flexGrow: 1, flexBasis: 0 }}>
          <Button label="remove" kind="danger" full onPress={onRemove} />
        </View>
        <View style={{ flexGrow: 1, flexBasis: 0 }}>
          <Button label="done" full onPress={onClose} />
        </View>
      </View>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      {children}
    </View>
  );
}

function Toggle({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Touch
      haptic="selection"
      onPress={onPress}
      style={{
        flexGrow: 1,
        flexBasis: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 44,
        borderRadius: radius.md,
        backgroundColor: on ? c.brandTint : c.fill,
        borderWidth: on ? 1.5 : 0,
        borderColor: c.brand,
      }}
    >
      <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={17} color={on ? c.brand : c.textTertiary} />
      <Text variant="callout" tone={on ? 'brand' : 'secondary'}>
        {label}
      </Text>
    </Touch>
  );
}

function RoleChip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Touch
      haptic="selection"
      onPress={onPress}
      style={{
        minWidth: 30,
        height: 26,
        paddingHorizontal: 7,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: on ? c.brand : c.fill,
      }}
    >
      <Text variant="tab" tone={on ? 'onBrand' : 'tertiary'} style={{ fontFamily: font.bold }}>
        {label}
      </Text>
    </Touch>
  );
}

/* ------------------------------------------------------------------ toss */

export function Toss({ match, onDone, onClose }: { match: Match; onDone: (m: Match) => void; onClose: () => void }) {
  const c = useColors();
  const [wonBy, setWonBy] = useState<string | null>(null);
  const [elected, setElected] = useState<'bat' | 'bowl' | null>(null);

  const ready = wonBy && elected;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Header title="toss" onClose={onClose} />

      <ScrollView contentContainerStyle={{ padding: space.gutter, gap: space.xxl }}>
        <View style={{ gap: space.md }}>
          <Text variant="caption" tone="secondary">
            who won the toss?
          </Text>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            {match.teams.map((t) => (
              <BigChoice key={t.id} label={t.name} selected={wonBy === t.id} onPress={() => setWonBy(t.id)} />
            ))}
          </View>
        </View>

        {wonBy && (
          <View style={{ gap: space.md }}>
            <Text variant="caption" tone="secondary">
              and elected to
            </Text>
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <BigChoice label="bat" icon="baseball" selected={elected === 'bat'} onPress={() => setElected('bat')} />
              <BigChoice label="bowl" icon="tennisball" selected={elected === 'bowl'} onPress={() => setElected('bowl')} />
            </View>
          </View>
        )}

        {ready && (
          <View
            style={{
              padding: space.lg,
              borderRadius: radius.md,
              backgroundColor: c.brandTint,
            }}
          >
            <Text variant="callout" tone="brand">
              {`${match.teams.find((t) => t.id === wonBy)!.name} won the toss and elected to ${elected}`}
            </Text>
          </View>
        )}
      </ScrollView>

      <Footer>
        <Button
          label="start scoring"
          size="lg"
          full
          disabled={!ready}
          onPress={() => onDone({ ...match, toss: { wonBy: wonBy!, elected: elected! } })}
        />
      </Footer>
    </View>
  );
}

function BigChoice({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const c = useColors();
  return (
    <Touch
      haptic="selection"
      onPress={onPress}
      style={{
        // flexBasis 0 + minWidth 0 so two long team names still split the row
        // evenly instead of one shouldering the other out
        flexGrow: 1,
        flexBasis: 0,
        minWidth: 0,
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.sm,
        paddingVertical: space.xxl,
        paddingHorizontal: space.md,
        borderRadius: radius.lg,
        backgroundColor: selected ? c.brandTint : c.surface,
        borderWidth: 2,
        borderColor: selected ? c.brand : c.hairline,
      }}
    >
      {icon && <Ionicons name={icon} size={26} color={selected ? c.brand : c.textTertiary} />}
      <Text variant="bodyStrong" tone={selected ? 'brand' : 'primary'} align="center" numberOfLines={2}>
        {label}
      </Text>
    </Touch>
  );
}
