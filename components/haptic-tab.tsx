// @ts-ignore
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
// @ts-ignore
import { PlatformPressable } from '@react-navigation/elements';
// @ts-ignore
import * as Haptics from 'expo-haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev: any) => {
        // @ts-ignore
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
