import React, { useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable as RNPressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from "react-native";

type AnimatedPressableProps = PressableProps & {
  androidRippleColor?: string;
  pressOpacity?: number;
  pressScale?: number;
  pressTranslateY?: number;
  style?: StyleProp<ViewStyle>;
};

const AnimatedBasePressable = Animated.createAnimatedComponent(RNPressable);

export function AnimatedPressable({
  androidRippleColor = "rgba(31, 107, 255, 0.16)",
  onPressIn,
  onPressOut,
  pressOpacity = 0.92,
  pressScale = 0.96,
  pressTranslateY = -1,
  style,
  ...props
}: AnimatedPressableProps) {
  const progress = useRef(new Animated.Value(0)).current;

  const animatedStyle = useMemo(
    () => ({
      opacity: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, pressOpacity],
      }),
      transform: [
        {
          scale: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [1, pressScale],
          }),
        },
        {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, pressTranslateY],
          }),
        },
      ],
    }),
    [pressOpacity, pressScale, pressTranslateY, progress]
  );

  function animateTo(value: 0 | 1) {
    Animated.timing(progress, {
      toValue: value,
      duration: value ? 110 : 180,
      easing: value ? Easing.out(Easing.quad) : Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  return (
    <AnimatedBasePressable
      {...props}
      android_ripple={{ color: androidRippleColor, borderless: false }}
      onPressIn={(event) => {
        animateTo(1);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateTo(0);
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    />
  );
}
