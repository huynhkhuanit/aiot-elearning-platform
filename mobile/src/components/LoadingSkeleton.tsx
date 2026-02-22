import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ViewStyle } from "react-native";
import { colors, radius, spacing } from "../theme";
type SkeletonVariant = "line" | "card" | "circle" | "thumbnail";
interface Props {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number;
  count?: number;
  style?: ViewStyle;
}
function SkeletonItem({
  width,
  height,
  borderRadius,
  style
}: {
  width: number | string;
  height: number;
  borderRadius: number;
  style?: ViewStyle;
}) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(shimmer, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true
    }), Animated.timing(shimmer, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true
    })]));
    loop.start();
    return () => loop.stop();
  }, [shimmer]);
  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7]
  });
  return <Animated.View style={[{
    width: width as any,
    height,
    borderRadius,
    backgroundColor: colors.light.surface,
    opacity
  }, style]} />;
}
const presets: Record<SkeletonVariant, {
  w: number | string;
  h: number;
  r: number;
}> = {
  line: {
    w: "100%",
    h: 14,
    r: radius.xs
  },
  card: {
    w: "100%",
    h: 120,
    r: radius.lg
  },
  circle: {
    w: 48,
    h: 48,
    r: radius.full
  },
  thumbnail: {
    w: "100%",
    h: 150,
    r: radius.lg
  }
};
export default function LoadingSkeleton({
  variant = "line",
  width,
  height,
  count = 1,
  style
}: Props) {
  const preset = presets[variant];
  const w = width ?? preset.w;
  const h = height ?? preset.h;
  const r = preset.r;
  return <View style={[styles.container, style]}>
            {Array.from({
      length: count
    }).map((_, i) => <SkeletonItem key={i} width={w} height={h} borderRadius={r} style={i > 0 ? {
      marginTop: spacing.sm
    } : undefined} />)}
        </View>;
}
const styles = StyleSheet.create({
  container: {
    overflow: "hidden"
  }
});