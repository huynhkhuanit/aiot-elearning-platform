import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { colors, animation } from "../theme";

/** Easing for smooth transitions (ui-ux-pro-max: transform/opacity, 150–300ms) */
const easeOutCubic = Easing.out(Easing.cubic);

interface Props {
  children: React.ReactNode;
}

export default function TabScreenWrapper({ children }: Props) {
  const isFocused = useIsFocused();
  const hasAnimatedIn = useRef(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (isFocused) {
      if (!hasAnimatedIn.current) {
        opacity.setValue(0);
        translateY.setValue(8);
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: animation.transition,
            easing: easeOutCubic,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: animation.transition,
            easing: easeOutCubic,
            useNativeDriver: true,
          }),
        ]).start(() => {
          hasAnimatedIn.current = true;
        });
      } else {
        opacity.setValue(1);
        translateY.setValue(0);
      }
    }
  }, [isFocused, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background
  }
});