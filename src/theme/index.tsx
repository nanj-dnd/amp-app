import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { light, dark, type Palette } from './tokens';

export * from './tokens';
export * from './motion';
export * from './reduceMotion';

const ThemeCtx = createContext<Palette>(light);

/**
 * wrap the app once. everything below reads colour through useColors().
 * `choice` is the athlete's setting; only 'system' defers to the os.
 */
export function ThemeProvider({
  children,
  choice = 'light',
}: {
  children: React.ReactNode;
  choice?: 'light' | 'dark' | 'system';
}) {
  const system = useColorScheme();
  const scheme = choice === 'system' ? (system === 'dark' ? 'dark' : 'light') : choice;
  const value = useMemo(() => (scheme === 'dark' ? (dark as unknown as Palette) : light), [scheme]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useColors(): Palette {
  return useContext(ThemeCtx);
}
