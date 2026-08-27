import { Platform } from 'react-native';

/**
 * android's blur is still unreliable across oems, so chrome there falls back
 * to a solid surface. ios and web get the real translucency.
 */
export const CAN_BLUR = Platform.OS !== 'android';
export const BLUR_INTENSITY = CAN_BLUR ? 60 : 0;
