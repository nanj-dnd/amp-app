import React, { useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, space, type } from '../theme';
import { Text } from './Text';
import { IconButton } from './Button';
import { TAB_BAR_SPACE } from './TabBar';
import { CAN_BLUR, BLUR_INTENSITY } from './chrome';

const BAR = 46;
const FADE_AT = 34; // large title has scrolled this far -> compact title takes over

/**
 * every tab screen uses this. gives the app one header behaviour:
 * large title in the content, collapsing into a blurred compact bar.
 * that is the single biggest thing that makes it read as an ios app.
 */
export function Screen({
  title,
  eyebrow,
  right,
  onBack,
  children,
  scroll = true,
}: {
  title: string;
  eyebrow?: string;
  right?: React.ReactNode;
  /** pushed screens pass this; it puts back in the same place on every screen */
  onBack?: () => void;
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(0)).current;

  const compactOpacity = y.interpolate({
    inputRange: [FADE_AT, FADE_AT + 22],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const chromeOpacity = y.interpolate({
    inputRange: [8, 30],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const header = (
    <View style={{ paddingHorizontal: space.gutter, paddingTop: space.sm, paddingBottom: space.lg }}>
      {onBack && (
        <View style={{ marginBottom: space.md }}>
          <IconButton icon="chevron-back" size={34} onPress={onBack} />
        </View>
      )}
      {eyebrow && (
        <Text variant="eyebrow" tone="brand" style={{ marginBottom: 6 }}>
          {eyebrow}
        </Text>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
        <Text variant="display" style={{ flexShrink: 1 }}>
          {title}
        </Text>
        {right}
      </View>
    </View>
  );

  const body = (
    <>
      {header}
      {children}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {scroll ? (
        <Animated.ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + BAR,
            paddingBottom: TAB_BAR_SPACE + insets.bottom + space.xxl,
          }}
          scrollIndicatorInsets={{ top: insets.top + BAR }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y } } }], { useNativeDriver: true })}
        >
          {body}
        </Animated.ScrollView>
      ) : (
        <View style={{ flex: 1, paddingTop: insets.top + BAR }}>{body}</View>
      )}

      {/* compact bar — invisible until you scroll, then blurs the content under it */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top + BAR,
          opacity: scroll ? chromeOpacity : 1,
        }}
      >
        <BlurView
          intensity={BLUR_INTENSITY}
          tint={c.scheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: CAN_BLUR ? c.scrim : c.bg }]} />
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: StyleSheet.hairlineWidth,
            backgroundColor: c.hairline,
          }}
        />
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            height: BAR,
            left: 0,
            right: 0,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: scroll ? compactOpacity : 1,
          }}
        >
          <Text style={{ ...type.heading }}>{title}</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** page-level section: gutter inset + a lowercase heading. */
export function Section({
  title,
  action,
  children,
  gap = space.md,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  gap?: number;
}) {
  return (
    <View style={{ paddingHorizontal: space.gutter, marginBottom: space.xxl }}>
      {title && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: space.md,
          }}
        >
          <Text variant="heading">{title}</Text>
          {action}
        </View>
      )}
      <View style={{ gap }}>{children}</View>
    </View>
  );
}
