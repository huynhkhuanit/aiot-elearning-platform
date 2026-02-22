import React, { useRef, useCallback } from "react";
import { Animated, Pressable, PressableProps, ViewStyle, StyleProp } from "react-native";
import { animation } from "../theme";
interface Props extends Omit<PressableProps, "style"> {
  scaleDown?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}
export default function AnimatedPressable({
  scaleDown = 0.97,
  style,
  children,
  onPress,
  disabled,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: scaleDown,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4
    }).start();
  }, [scale, scaleDown]);
  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4
    }).start();
  }, [scale]);
  return <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} disabled={disabled} {...rest}>
            <Animated.View style={[style as ViewStyle, {
      transform: [{
        scale
      }]
    }]}>
                {children}
            </Animated.View>
        </Pressable>;
}