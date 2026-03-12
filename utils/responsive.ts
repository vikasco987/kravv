import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device (iPhone 11/13/14 are around 390-430 width)
// Let's use 375 as the base width.
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Converts provided width percentage to independent pixel (dp).
 * @param widthPercent The percentage of screen's width that UI element should cover.
 * @return number
 */
export const wp = (widthPercent: number | string): number => {
  const elemWidth = typeof widthPercent === "number" ? widthPercent : parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel(SCREEN_WIDTH * elemWidth / 100);
};

/**
 * Converts provided height percentage to independent pixel (dp).
 * @param heightPercent The percentage of screen's height that UI element should cover.
 * @return number
 */
export const hp = (heightPercent: number | string): number => {
  const elemHeight = typeof heightPercent === "number" ? heightPercent : parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel(SCREEN_HEIGHT * elemHeight / 100);
};

/**
 * Normalizes font size based on screen width.
 * @param size Standard font size.
 * @return number
 */
export const rf = (size: number): number => {
  const scale = SCREEN_WIDTH / guidelineBaseWidth;
  const newSize = size * scale;
  
  const platformScale = Platform.OS === 'ios' ? 0 : 2;
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - platformScale;
};

/**
 * Scales a size based on screen width.
 * @param size The size to scale.
 * @return number
 */
export const s = (size: number): number => {
  const scale = SCREEN_WIDTH / guidelineBaseWidth;
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
};

/**
 * Scales a size based on screen height.
 * @param size The size to scale.
 * @return number
 */
export const vs = (size: number): number => {
  const scale = SCREEN_HEIGHT / guidelineBaseHeight;
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
};

/**
 * Moderate scaling for sizes that shouldn't grow too much.
 * @param size The size to scale.
 * @param factor The modulation factor (default 0.5).
 * @return number
 */
export const ms = (size: number, factor = 0.5): number => {
  return size + (s(size) - size) * factor;
};

export const SCREEN_SIZE = {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT
};
