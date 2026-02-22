import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { colors } from "../theme";

interface Props {
    children: React.ReactNode;
}

export default function TabScreenWrapper({ children }: Props) {
    const isFocused = useIsFocused();
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(10)).current;

    useEffect(() => {
        if (isFocused) {
            opacity.setValue(0);
            translateY.setValue(10);
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isFocused, opacity, translateY]);

    return (
        <Animated.View
            style={[styles.container, { opacity, transform: [{ translateY }] }]}
        >
            {children}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.light.background,
    },
});
