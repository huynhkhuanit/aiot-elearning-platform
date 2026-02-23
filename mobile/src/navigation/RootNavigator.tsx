import React from "react";
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { colors, shadows, radius, spacing, typography, animation } from "../theme";

// Transition config (ui-ux-pro-max: 150-300ms, transform/opacity, đơn giản)
const DURATION = animation.transition; // 280ms
const EASING = Easing.bezier(0.4, 0, 0.2, 1);

const slideTransitionSpec = {
  open: { animation: "timing" as const, config: { duration: DURATION, easing: EASING } },
  close: { animation: "timing" as const, config: { duration: DURATION, easing: EASING } },
};

const fadeTransitionSpec = {
  open: { animation: "timing" as const, config: { duration: DURATION, easing: EASING } },
  close: { animation: "timing" as const, config: { duration: DURATION * 0.8, easing: EASING } },
};

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
import { AuthStackParamList, HomeStackParamList, CoursesStackParamList, ProfileStackParamList, RootStackParamList, MainTabsParamList } from "./types";
import { View, ActivityIndicator, StyleSheet, Platform, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// --- Shared screen options for content stacks (slide from right) ---
// animation: 'slide_from_right' bắt buộc bật transition trên web (mặc định web dùng 'none')
const contentScreenOptions = {
  headerStyle: { backgroundColor: colors.light.background },
  headerTintColor: colors.light.text,
  headerTitleStyle: { fontWeight: "600" as const },
  headerShadowVisible: false,
  gestureEnabled: true,
  animation: "slide_from_right" as const,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  transitionSpec: slideTransitionSpec,
};

// --- Auth Stack (fade) ---
const AuthStack = createStackNavigator<AuthStackParamList>();
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade" as const,
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
        transitionSpec: fadeTransitionSpec,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// --- Home Stack ---
const HomeStack = createStackNavigator<HomeStackParamList>();
function HomeNavigator() {
  return <HomeStack.Navigator screenOptions={contentScreenOptions}>
            <HomeStack.Screen name="HomeScreen" component={HomeScreen} options={{
      headerShown: false
    }} />
            <HomeStack.Screen name="CourseDetail" component={CourseDetailScreen} options={{
      title: "Chi tiết khoá học"
    }} />
            <HomeStack.Screen name="LessonVideo" component={LessonVideoScreen} options={{
      title: "Bài học"
    }} />
        </HomeStack.Navigator>;
}

// --- Courses Stack ---
const CoursesStack = createStackNavigator<CoursesStackParamList>();
function CoursesNavigator() {
  return <CoursesStack.Navigator screenOptions={contentScreenOptions}>
            <CoursesStack.Screen name="CoursesList" component={CoursesScreen} options={{
      headerShown: false
    }} />
            <CoursesStack.Screen name="CourseDetail" component={CourseDetailScreen} options={{
      title: "Chi tiết khoá học"
    }} />
            <CoursesStack.Screen name="LessonVideo" component={LessonVideoScreen} options={{
      title: "Bài học"
    }} />
        </CoursesStack.Navigator>;
}

// --- Profile Stack ---
const ProfileStack = createStackNavigator<ProfileStackParamList>();
function ProfileNavigator() {
  return <ProfileStack.Navigator screenOptions={contentScreenOptions}>
            <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} options={{
      headerShown: false
    }} />
            <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{
      title: "Chỉnh sửa hồ sơ"
    }} />
            <ProfileStack.Screen name="CourseDetail" component={CourseDetailScreen} options={{
      title: "Chi tiết khoá học"
    }} />
        </ProfileStack.Navigator>;
}
// --- Bottom Tabs ---
const Tab = createBottomTabNavigator<MainTabsParamList>();
function MainTabs() {
  return (
    <Tab.Navigator
      detachInactiveScreens={false}
      screenOptions={({
    route
  }) => ({
    headerShown: false,
    tabBarIcon: ({
      focused,
      color
    }) => {
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
      return <View style={tabStyles.iconWrap}>
                            <Ionicons name={iconName} size={24} color={color} />
                            {focused && <View style={tabStyles.activeDot} />}
                        </View>;
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
      ...shadows.lg
    },
    tabBarLabelStyle: {
      ...typography.tiny,
      marginTop: 2
    }
  })}>
            <Tab.Screen name="Home" component={HomeNavigator} options={{
      tabBarLabel: "Trang chủ"
    }} />
      <Tab.Screen name="Courses" component={CoursesNavigator} options={{
      tabBarLabel: "Khoá học"
    }} />
      <Tab.Screen name="Profile" component={ProfileNavigator} options={{
      tabBarLabel: "Hồ sơ"
    }} />
    </Tab.Navigator>
  );
}
const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: "center"
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.light.primary,
    marginTop: 3
  }
});

// --- Root Navigator (Auth or Main) ---
const RootStack = createStackNavigator<RootStackParamList>();
export default function RootNavigator() {
  const {
    isAuthenticated,
    isLoading
  } = useAuth();
  if (isLoading) {
    return <View style={styles.loadingContainer}>
                <LinearGradient colors={[colors.light.gradientFrom, colors.light.gradientTo]} start={{
        x: 0,
        y: 0
      }} end={{
        x: 1,
        y: 1
      }} style={StyleSheet.absoluteFill} />
                {/* Decorative shapes */}
                <View style={styles.splashCircle1} />
                <View style={styles.splashCircle2} />
                <View style={styles.splashContent}>
                    <View style={styles.splashLogo}>
                        <Ionicons name="code-slash" size={36} color="#ffffff" />
                    </View>
                    <Text style={styles.splashName}>DHV LearnX</Text>
                    <Text style={styles.splashTagline}>
                        Nền tảng học lập trình AIoT
                    </Text>
                </View>
                <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" style={styles.splashLoader} />
            </View>;
  }
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade" as const,
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
        transitionSpec: fadeTransitionSpec,
      }}
    >
            {isAuthenticated ? <RootStack.Screen name="Main" component={MainTabs} /> : <RootStack.Screen name="Auth" component={AuthNavigator} />}
    </RootStack.Navigator>
  );
}
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  splashCircle1: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.06)"
  },
  splashCircle2: {
    position: "absolute",
    bottom: 80,
    left: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.04)"
  },
  splashContent: {
    alignItems: "center"
  },
  splashLogo: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)"
  },
  splashName: {
    ...typography.h1,
    color: "#ffffff",
    marginBottom: spacing.xs
  },
  splashTagline: {
    ...typography.caption,
    color: "rgba(255,255,255,0.7)"
  },
  splashLoader: {
    position: "absolute",
    bottom: 80
  }
});