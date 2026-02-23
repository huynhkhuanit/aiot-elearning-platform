import "@tamagui/native/setup-zeego";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TamaguiProvider } from "tamagui";
import tamaguiConfig from "./tamagui.config";
import { AuthProvider } from "./src/contexts/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";
import ToastProvider from "./src/components/Toast";

export default function App() {
    return (
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
            <GestureHandlerRootView style={{ flex: 1 }}>
                <SafeAreaProvider>
                    <NavigationContainer>
                        <AuthProvider>
                            <ToastProvider>
                                <StatusBar style="auto" />
                                <RootNavigator />
                            </ToastProvider>
                        </AuthProvider>
                    </NavigationContainer>
                </SafeAreaProvider>
            </GestureHandlerRootView>
        </TamaguiProvider>
    );
}
