import React from 'react';
import { View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../ui/Text';
import { Card, Divider } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { useColors, space, radius, font } from '../../theme';
import { Header, Footer } from './Setup';
import {
  totalRuns,
  wickets,
  oversText,
  runRate,
  battingCard,
  bowlingCard,
  extrasBreakdown,
  oversFor,
  nameLookup,
  teamById,
} from '../../match/engine';
import type { Match } from '../../match/types';

/**
 * the gap between innings. it exists to state the target in one number, because
 * that number is the whole of the second innings.
 */
export function InningsBreak({ match, onStart, onExit }: { match: Match; onStart: () => void; onExit?: () => void }) {
  const c = useColors();
  const first = match.innings[0];
  const name = nameLookup(match);
  const batTeam = teamById(match, first.battingTeamId);
  const chasing = teamById(match, first.bowlingTeamId);

  const runs = totalRuns(first);
  const top = battingCard(first, batTeam)
    .filter((b) => b.balls > 0)
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 3);
  const best = bowlingCard(first)
    .filter((b) => b.balls > 0)
    .sort((a, b) => b.wickets - a.wickets || a.economy - b.economy)
    .slice(0, 3);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Header title="innings break" onClose={onExit} />

      <ScrollView contentContainerStyle={{ padding: space.gutter, gap: space.lg, paddingBottom: space.xxxl }}>
        <Card style={{ backgroundColor: c.brand, gap: space.sm }}>
          <Text variant="eyebrow" color="rgba(255,255,255,0.62)">
            target
          </Text>
          <Text style={{ fontFamily: font.black, fontSize: 44, letterSpacing: -2, color: '#FFFFFF' }}>
            {String(runs + 1)}
          </Text>
          <Text variant="callout" color="rgba(255,255,255,0.8)">
            {`${chasing.name} need ${runs + 1} off ${match.config.overs} overs`}
          </Text>
        </Card>

        <Card style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {batTeam.name}
            </Text>
            <Text variant="heading">{`${runs}/${wickets(first)}`}</Text>
            <Text variant="caption" tone="tertiary">{`(${oversText(first)})`}</Text>
          </View>
          <Text variant="caption" tone="secondary">
            {`run rate ${runRate(first).toFixed(2)} · extras ${extrasBreakdown(first).total}`}
          </Text>
        </Card>

        <Card padded={false}>
          <Head label="top scorers" />
          {top.map((b, i) => (
            <View key={b.playerId}>
              {i > 0 && <Divider inset={space.lg} />}
              <View style={{ flexDirection: 'row', paddingHorizontal: space.lg, paddingVertical: space.md }}>
                <Text variant="callout" style={{ flex: 1 }}>
                  {name(b.playerId)}
                </Text>
                <Text variant="callout" style={{ fontFamily: font.bold }}>
                  {`${b.runs} (${b.balls})`}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        <Card padded={false}>
          <Head label="bowling" />
          {best.map((b, i) => (
            <View key={b.playerId}>
              {i > 0 && <Divider inset={space.lg} />}
              <View style={{ flexDirection: 'row', paddingHorizontal: space.lg, paddingVertical: space.md }}>
                <Text variant="callout" style={{ flex: 1 }}>
                  {name(b.playerId)}
                </Text>
                <Text variant="callout" style={{ fontFamily: font.bold }}>
                  {`${oversFor(b.balls)}-${b.maidens}-${b.runs}-${b.wickets}`}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>

      <Footer>
        <Button label={`start ${chasing.name.toLowerCase()}'s chase`} size="lg" full icon="play" onPress={onStart} />
      </Footer>
    </View>
  );
}

function Head({ label }: { label: string }) {
  const c = useColors();
  return (
    <View style={{ paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: c.fill }}>
      <Text variant="tab" tone="tertiary">
        {label}
      </Text>
    </View>
  );
}

/** the end of the match. */
export function MatchResult({ match, onDone }: { match: Match; onDone: () => void }) {
  const c = useColors();
  const name = nameLookup(match);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Header title="result" onClose={onDone} />
      <ScrollView contentContainerStyle={{ padding: space.gutter, gap: space.lg }}>
        <Card style={{ alignItems: 'center', gap: space.md, paddingVertical: space.xxxl }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: c.brandTint,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="trophy" size={26} color={c.brand} />
          </View>
          <Text variant="title" align="center">
            {match.result ?? 'match over'}
          </Text>
        </Card>

        {match.innings.map((inn, i) => (
          <Card key={i} style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {teamById(match, inn.battingTeamId).name}
            </Text>
            <Text variant="heading">{`${totalRuns(inn)}/${wickets(inn)}`}</Text>
            <Text variant="caption" tone="tertiary">{`(${oversText(inn)})`}</Text>
          </Card>
        ))}
      </ScrollView>

      <Footer>
        <Button label="done" size="lg" full onPress={onDone} />
      </Footer>
    </View>
  );
}
