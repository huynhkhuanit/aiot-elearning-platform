import React, { useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    Platform,
    Pressable,
    type LayoutChangeEvent,
    Dimensions,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography } from "../theme";

const ICON_SIZE = 22;
const PILL_HEIGHT = 34;
const PILL_PADDING_H = 10;
const PILL_PADDING_V = 4;
const PILL_GAP = 6;
const BAR_MARGIN_H = 16;
const BAR_PADDING_V = 6;
const ANIM_DURATION = 280;
const BAR_BORDER_WIDTH = 1.5;

// Clamp pill position so it never overflows outside the bar
function clampPillX(x: number, pillWidth: number, barWidth: number): number {
    const innerWidth = barWidth - BAR_BORDER_WIDTH * 2;
    const minX = BAR_PADDING_V; // same gap as vertical for uniform spacing
    const maxX = innerWidth - pillWidth - BAR_PADDING_V;
    return Math.max(minX, Math.min(maxX, x));
}

// Exported so screens can add bottom padding to avoid content being hidden
export const TAB_BAR_TOTAL_HEIGHT = PILL_HEIGHT + BAR_PADDING_V * 2 + 3 + 16; // pill + padding + border + spacing

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
    Home: { active: "home", inactive: "home-outline" },
    Courses: { active: "book", inactive: "book-outline" },
    AIChat: {
        active: "chatbubble-ellipses",
        inactive: "chatbubble-ellipses-outline",
    },
    Profile: { active: "person", inactive: "person-outline" },
};

const TAB_LABELS: Record<string, string> = {
    Home: "Trang chủ",
    Courses: "Khoá học",
    AIChat: "AI Chat",
    Profile: "Hồ sơ",
};

export default function AnimatedTabBar({
    state,
    descriptors,
    navigation,
    insets,
}: BottomTabBarProps) {
    // Hide tab bar when the focused route sets tabBarStyle display: 'none'
    const focusedRoute = state.routes[state.index];
    const focusedDescriptor = descriptors[focusedRoute.key];
    const tabBarStyle = focusedDescriptor?.options?.tabBarStyle as any;
    if (tabBarStyle?.display === "none") {
        return null;
    }

    const pillTranslateX = useRef(new Animated.Value(0)).current;
    const tabsWidthRef = useRef(0);

    const focusedIndex = state.index;
    const { width: screenWidth } = Dimensions.get("window");
    const barWidth = screenWidth - BAR_MARGIN_H * 2;

    const barPaddingH = PILL_PADDING_H;

    useEffect(() => {
        if (tabsWidthRef.current > 0 && state.routes.length > 0) {
            const tabWidth = tabsWidthRef.current / state.routes.length;
            const pillWidth = getPillWidth(state.routes[focusedIndex].name);
            const rawX =
                barPaddingH +
                focusedIndex * tabWidth +
                tabWidth / 2 -
                pillWidth / 2;
            const targetX = clampPillX(rawX, pillWidth, barWidth);
            Animated.timing(pillTranslateX, {
                toValue: targetX,
                duration: ANIM_DURATION,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
            }).start();
        }
    }, [
        focusedIndex,
        pillTranslateX,
        state.routes.length,
        barPaddingH,
        barWidth,
    ]);

    const handleTabsLayout = (e: LayoutChangeEvent) => {
        const w = e.nativeEvent.layout.width;
        tabsWidthRef.current = w;
        if (w > 0 && state.routes.length > 0) {
            const tabWidth = w / state.routes.length;
            const pillWidth = getPillWidth(state.routes[focusedIndex].name);
            const rawX =
                barPaddingH +
                focusedIndex * tabWidth +
                tabWidth / 2 -
                pillWidth / 2;
            pillTranslateX.setValue(clampPillX(rawX, pillWidth, barWidth));
        }
    };

    const bottomInset = insets?.bottom ?? (Platform.OS === "ios" ? 28 : 10);
    const focusedLabel = TAB_LABELS[focusedRoute.name] ?? focusedRoute.name;
    const focusedIconName = (TAB_ICONS[focusedRoute.name]?.active ??
        "ellipse") as React.ComponentProps<typeof Ionicons>["name"];

    return (
        <View
            style={[
                styles.wrapper,
                {
                    paddingBottom: bottomInset,
                },
            ]}
        >
            <View style={[styles.bar, { width: barWidth }]}>
                {/* Sliding pill - icon + label when active */}
                <Animated.View
                    style={[
                        styles.pill,
                        {
                            width: getPillWidth(focusedRoute.name),
                            transform: [{ translateX: pillTranslateX }],
                        },
                    ]}
                >
                    <Ionicons
                        name={focusedIconName}
                        size={ICON_SIZE}
                        color={colors.light.textOnPrimary}
                    />
                    <Text style={styles.pillLabel} numberOfLines={1}>
                        {focusedLabel}
                    </Text>
                </Animated.View>

                {/* Inactive icons - only icons, no labels */}
                <View style={styles.tabs} onLayout={handleTabsLayout}>
                    {state.routes.map((route, index) => {
                        const isFocused = state.index === index;
                        const iconConfig = TAB_ICONS[route.name] ?? {
                            active: "ellipse",
                            inactive: "ellipse",
                        };
                        const iconName = (
                            isFocused ? iconConfig.active : iconConfig.inactive
                        ) as React.ComponentProps<typeof Ionicons>["name"];

                        const onPress = () => {
                            const event = navigation.emit({
                                type: "tabPress",
                                target: route.key,
                                canPreventDefault: true,
                            });
                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        return (
                            <Pressable
                                key={route.key}
                                onPress={onPress}
                                style={styles.tab}
                                hitSlop={{
                                    top: 12,
                                    bottom: 12,
                                    left: 12,
                                    right: 12,
                                }}
                            >
                                <View style={{ opacity: isFocused ? 0 : 1 }}>
                                    <Ionicons
                                        name={iconName}
                                        size={ICON_SIZE}
                                        color={colors.light.tabInactive}
                                    />
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

const PILL_MIN_WIDTH = 100;
const PILL_MAX_WIDTH = 130;

function getPillWidth(routeName: string): number {
    const label = TAB_LABELS[routeName] ?? routeName;
    const labelWidth = Math.min(label.length * 8, 80);
    return Math.max(
        PILL_MIN_WIDTH,
        Math.min(
            PILL_MAX_WIDTH,
            PILL_PADDING_H * 2 + ICON_SIZE + PILL_GAP + labelWidth,
        ),
    );
}

const styles = StyleSheet.create({
    wrapper: {
        alignItems: "center",
        overflow: "visible",
        backgroundColor: colors.light.background,
        borderTopWidth: 0,
    },
    bar: {
        backgroundColor: colors.light.tabBar,
        borderRadius: 999,
        marginHorizontal: BAR_MARGIN_H,
        marginBottom: 4,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: PILL_PADDING_H,
        paddingVertical: BAR_PADDING_V,
        borderWidth: 1.5,
        borderColor: colors.light.border,
        minHeight: PILL_HEIGHT + BAR_PADDING_V * 2,
    },
    pill: {
        position: "absolute",
        top: BAR_PADDING_V,
        left: 0,
        zIndex: 10,
        height: PILL_HEIGHT,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: PILL_GAP,
        paddingHorizontal: PILL_PADDING_H,
        paddingVertical: PILL_PADDING_V,
        backgroundColor: colors.light.primary,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.light.primaryDark,
    },
    pillLabel: {
        ...typography.small,
        color: colors.light.textOnPrimary,
        fontWeight: "700",
    },
    tabs: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
    },
    tab: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        minHeight: PILL_HEIGHT,
    },
});
