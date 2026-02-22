import React, { memo } from "react";
import { View, Text, Image, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, radius, spacing } from "../theme";
import { getInitials } from "../utils/format";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface Props {
    name: string;
    imageUrl?: string | null;
    size?: AvatarSize;
    showRing?: boolean;
    online?: boolean;
    style?: ViewStyle;
}

const sizeMap: Record<
    AvatarSize,
    { container: number; text: keyof typeof typography; ring: number }
> = {
    xs: { container: 32, text: "small", ring: 2 },
    sm: { container: 40, text: "caption", ring: 2 },
    md: { container: 56, text: "bodyMedium", ring: 2.5 },
    lg: { container: 80, text: "h2", ring: 3 },
    xl: { container: 104, text: "h1", ring: 3.5 },
};

function Avatar({
    name,
    imageUrl,
    size = "md",
    showRing = false,
    online,
    style,
}: Props) {
    const config = sizeMap[size];
    const containerSize = config.container;
    const onlineDotSize = Math.max(containerSize * 0.2, 10);

    return (
        <View style={[{ position: "relative" }, style]}>
            {showRing ? (
                <LinearGradient
                    colors={[
                        colors.light.gradientFrom,
                        colors.light.gradientTo,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.ring,
                        {
                            width: containerSize + config.ring * 4,
                            height: containerSize + config.ring * 4,
                            borderRadius: radius.full,
                            padding: config.ring,
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.ringInner,
                            {
                                width: containerSize + config.ring * 2,
                                height: containerSize + config.ring * 2,
                                borderRadius: radius.full,
                                padding: config.ring,
                            },
                        ]}
                    >
                        {renderContent(
                            imageUrl,
                            name,
                            containerSize,
                            config.text,
                        )}
                    </View>
                </LinearGradient>
            ) : (
                renderContent(imageUrl, name, containerSize, config.text)
            )}

            {online !== undefined && (
                <View
                    style={[
                        styles.onlineDot,
                        {
                            width: onlineDotSize,
                            height: onlineDotSize,
                            borderRadius: onlineDotSize / 2,
                            backgroundColor: online
                                ? colors.light.success
                                : colors.light.textMuted,
                            borderWidth: Math.max(onlineDotSize * 0.2, 2),
                        },
                    ]}
                />
            )}
        </View>
    );
}

function renderContent(
    imageUrl: string | null | undefined,
    name: string,
    size: number,
    textKey: keyof typeof typography,
) {
    if (imageUrl) {
        return (
            <Image
                source={{ uri: imageUrl }}
                style={{
                    width: size,
                    height: size,
                    borderRadius: radius.full,
                }}
            />
        );
    }

    return (
        <LinearGradient
            colors={[colors.light.gradientFrom, colors.light.gradientTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
                width: size,
                height: size,
                borderRadius: radius.full,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Text style={[typography[textKey], { color: "#ffffff" }]}>
                {getInitials(name)}
            </Text>
        </LinearGradient>
    );
}

export default memo(Avatar);

const styles = StyleSheet.create({
    ring: {
        justifyContent: "center",
        alignItems: "center",
    },
    ringInner: {
        backgroundColor: colors.light.background,
        justifyContent: "center",
        alignItems: "center",
    },
    onlineDot: {
        position: "absolute",
        bottom: 0,
        right: 0,
        borderColor: colors.light.background,
    },
});
