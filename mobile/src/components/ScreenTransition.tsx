import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle, StyleProp } from "react-native";
import { animation } from "../theme";

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
    duration,
    slideDistance = 24,
    style,
}: Props) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(slideDistance)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: duration || animation.slow,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: duration || animation.slow,
                delay,
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
 * a cascading entrance effect.
 */
export function StaggerChildren({
    children,
    staggerMs = 80,
    slideDistance = 20,
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
