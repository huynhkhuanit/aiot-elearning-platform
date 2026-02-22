import React, { useEffect, useRef } from "react";
import { Animated, Easing, ViewStyle, StyleProp } from "react-native";
import { animation } from "../theme";

/** Easing for smooth entrance (ui-ux-pro-max: 150–300ms, transform/opacity) */
const easeOutCubic = Easing.out(Easing.cubic);

interface Props {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  slideDistance?: number;
  style?: StyleProp<ViewStyle>;
}

export default function ScreenTransition({
  children,
  delay = 0,
  duration = animation.transition,
  slideDistance = 16,
  style,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(slideDistance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: easeOutCubic,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: easeOutCubic,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delay, duration, slideDistance]);

  return (
    <Animated.View
      style={[
        style,
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

/**
 * Stagger helper: wraps each child with increasing delay for
 * a cascading entrance effect (ui-ux-pro-max: 60–80ms stagger).
 */
export function StaggerChildren({
  children,
  staggerMs = 60,
  slideDistance = 16,
  style,
}: {
  children: React.ReactNode[];
  staggerMs?: number;
  slideDistance?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <ScreenTransition
          delay={index * staggerMs}
          slideDistance={slideDistance}
          style={style}
        >
          {child}
        </ScreenTransition>
      ))}
    </>
  );
}