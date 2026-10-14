import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { LogBox, View, ActivityIndicator } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect, useRef } from "react";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { AuthProvider, useAuth } from "@/src/auth";
import { useTheme } from "@/src/theme";
import { initializeRevenueCat, SubscriptionProvider } from "@/lib/revenuecat";
import { ModeProvider } from "@/src/mode";
import { ParentalGate } from "@/src/components/ParentalGate";

LogBox.ignoreAllLogs(true);

// RevenueCat SDK init MUST happen once at module scope, before any component mounts.
try {
  initializeRevenueCat();
} catch (err) {
  console.warn("RevenueCat unavailable:", err);
}

// Prewarm icon assets for Expo Go android fix (preserve this logic)
function prewarmIconAssets() {
  // Noop: Expo vector icons prewarm handled by expo-font plugin.
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { colors } = useTheme();
  const initialRouted = useRef(false);

  useEffect(() => {
    if (loading) return;
    const seg0 = segments[0] as string | undefined;
    const inAuth = seg0 === "login" || seg0 === "signup";

    if (!user && !inAuth) {
      router.replace("/login");
    } else if (user && (inAuth || seg0 === undefined || seg0 === "index")) {
      initialRouted.current = true;
      router.replace("/(tabs)");
    }
  }, [user, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    prewarmIconAssets();
  }, []);
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <KeyboardProvider>
            <AuthProvider>
              <SubscriptionProvider>
                <ModeProvider>
                  <AuthGate>
                    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />
                  </AuthGate>
                  <ParentalGate />
                </ModeProvider>
              </SubscriptionProvider>
            </AuthProvider>
          </KeyboardProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
