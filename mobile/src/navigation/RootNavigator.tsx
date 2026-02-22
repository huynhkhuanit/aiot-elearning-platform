import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { colors, shadows, radius, spacing, typography } from "../theme";

// Auth Screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

// Main Screens
import HomeScreen from "../screens/home/HomeScreen";
import CoursesScreen from "../screens/courses/CoursesScreen";
import CourseDetailScreen from "../screens/courses/CourseDetailScreen";
import LessonVideoScreen from "../screens/courses/LessonVideoScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import EditProfileScreen from "../screens/profile/EditProfileScreen";

// Navigation types
import {
    AuthStackParamList,
    HomeStackParamList,
    CoursesStackParamList,
    ProfileStackParamList,
    RootStackParamList,
    MainTabsParamList,
} from "./types";

import {
    View,
    ActivityIndicator,
    StyleSheet,
    Platform,
    Text,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// --- Auth Stack ---
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
function AuthNavigator() {
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
    );
}

// --- Home Stack ---
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
function HomeNavigator() {
    return (
        <HomeStack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.light.background },
                headerTintColor: colors.light.text,
                headerTitleStyle: { fontWeight: "600" },
                headerShadowVisible: false,
            }}
        >
            <HomeStack.Screen
                name="HomeScreen"
                component={HomeScreen}
                options={{ headerShown: false }}
            />
            <HomeStack.Screen
                name="CourseDetail"
                component={CourseDetailScreen}
                options={{ title: "Chi tiết khoá học" }}
            />
            <HomeStack.Screen
                name="LessonVideo"
                component={LessonVideoScreen}
                options={{ title: "Bài học" }}
            />
        </HomeStack.Navigator>
    );
}

// --- Courses Stack ---
const CoursesStack = createNativeStackNavigator<CoursesStackParamList>();
function CoursesNavigator() {
    return (
        <CoursesStack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.light.background },
                headerTintColor: colors.light.text,
                headerTitleStyle: { fontWeight: "600" },
                headerShadowVisible: false,
            }}
        >
            <CoursesStack.Screen
                name="CoursesList"
                component={CoursesScreen}
                options={{ headerShown: false }}
            />
            <CoursesStack.Screen
                name="CourseDetail"
                component={CourseDetailScreen}
                options={{ title: "Chi tiết khoá học" }}
            />
            <CoursesStack.Screen
                name="LessonVideo"
                component={LessonVideoScreen}
                options={{ title: "Bài học" }}
            />
        </CoursesStack.Navigator>
    );
}

// --- Profile Stack ---
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
function ProfileNavigator() {
    return (
        <ProfileStack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.light.background },
                headerTintColor: colors.light.text,
                headerTitleStyle: { fontWeight: "600" },
                headerShadowVisible: false,
            }}
        >
            <ProfileStack.Screen
                name="ProfileScreen"
                component={ProfileScreen}
                options={{ headerShown: false }}
            />
            <ProfileStack.Screen
                name="EditProfile"
                component={EditProfileScreen}
                options={{ title: "Chỉnh sửa hồ sơ" }}
            />
            <ProfileStack.Screen
                name="CourseDetail"
                component={CourseDetailScreen}
                options={{ title: "Chi tiết khoá học" }}
            />
        </ProfileStack.Navigator>
    );
}

// --- Bottom Tabs ---
const Tab = createBottomTabNavigator<MainTabsParamList>();
function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color }) => {
                    let iconName: React.ComponentProps<typeof Ionicons>["name"];

                    if (route.name === "Home") {
                        iconName = focused ? "home" : "home-outline";
                    } else if (route.name === "Courses") {
                        iconName = focused ? "book" : "book-outline";
                    } else if (route.name === "Profile") {
                        iconName = focused ? "person" : "person-outline";
                    } else {
                        iconName = "ellipse";
                    }

                    return (
                        <View style={tabStyles.iconWrap}>
                            <Ionicons name={iconName} size={24} color={color} />
                            {focused && <View style={tabStyles.activeDot} />}
                        </View>
                    );
                },
                tabBarActiveTintColor: colors.light.primary,
                tabBarInactiveTintColor: colors.light.tabInactive,
                tabBarStyle: {
                    backgroundColor: colors.light.tabBar,
                    borderTopColor: colors.light.border,
                    borderTopWidth: 1,
                    borderTopLeftRadius: radius.xl,
                    borderTopRightRadius: radius.xl,
                    height: Platform.OS === "ios" ? 88 : 68,
                    paddingBottom: Platform.OS === "ios" ? 28 : 10,
                    paddingTop: 10,
                    position: "absolute",
                    ...shadows.lg,
                },
                tabBarLabelStyle: {
                    ...typography.tiny,
                    marginTop: 2,
                },
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeNavigator}
                options={{ tabBarLabel: "Trang chủ" }}
            />
            <Tab.Screen
                name="Courses"
                component={CoursesNavigator}
                options={{ tabBarLabel: "Khoá học" }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileNavigator}
                options={{ tabBarLabel: "Hồ sơ" }}
            />
        </Tab.Navigator>
    );
}

const tabStyles = StyleSheet.create({
    iconWrap: {
        alignItems: "center",
    },
    activeDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: colors.light.primary,
        marginTop: 3,
    },
});

// --- Root Navigator (Auth or Main) ---
const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient
                    colors={[
                        colors.light.gradientFrom,
                        colors.light.gradientTo,
                    ]}
                    style={StyleSheet.absoluteFill}
                />
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    return (
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
                <RootStack.Screen name="Main" component={MainTabs} />
            ) : (
                <RootStack.Screen name="Auth" component={AuthNavigator} />
            )}
        </RootStack.Navigator>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
