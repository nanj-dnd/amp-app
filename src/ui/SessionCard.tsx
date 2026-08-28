import React from 'react';
import { View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { Text } from './Text';
import { Touch } from './Pressable';
import { ScoreBadge } from './Score';
import { useColors, space } from '../theme';

/**
 * one session. it doesn't carry a name — this is your own list, so the name was
 * the same word on every row.
 */
export function SessionCard({
  kind,
  when,
  score,
  onPress,
  onDelete,
}: {
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
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{kind}</Text>
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
