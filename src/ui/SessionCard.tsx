import React from 'react';
import { View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { Text } from './Text';
import { Touch } from './Pressable';
import { ScoreBadge } from './Score';
import { useColors, space } from '../theme';

export function SessionCard({
  player,
  kind,
  when,
  score,
  onPress,
  onDelete,
}: {
  player: string;
  kind: string;
  when: string;
  score: number;
  onPress?: () => void;
  onDelete?: () => void;
}) {
  const c = useColors();
  return (
    <Card onPress={onPress} padded={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: space.xl, gap: space.md }}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text variant="eyebrow" tone="tertiary">
            {kind}
          </Text>
          <Text variant="bodyStrong">{player}</Text>
          <Text variant="caption" tone="secondary">
            {when}
          </Text>
        </View>

        <ScoreBadge value={score} size="sm" />

        <Touch
          scale={false}
          haptic="medium"
          onPress={() =>
            Alert.alert('delete session?', "this can't be undone.", [
              { text: 'cancel', style: 'cancel' },
              { text: 'delete', style: 'destructive', onPress: onDelete },
            ])
          }
          style={{ padding: space.sm, marginRight: -space.sm }}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={c.textTertiary} />
        </Touch>
      </View>
    </Card>
  );
}
