import { View, Text, StyleSheet, TextInput, ScrollView, Platform, KeyboardAvoidingView, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";

import { useAuth } from "@/src/auth";
import { useTheme, spacing, radius } from "@/src/theme";
import { Button } from "@/src/components/Button";

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onLogin = async () => {
    setErr(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setErr(null);
    setGoogleLoading(true);
    try { await signInWithGoogle(); } catch (e: any) { setErr(e.message || "Google sign-in failed"); }
    finally { setGoogleLoading(false); }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.surface }}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl, paddingHorizontal: spacing.xl }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBox}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1758687126048-4790d3d7e4ea?crop=entropy&cs=srgb&fm=jpg&w=800" }}
            style={styles.hero}
          />
        </View>
        <Text style={[styles.title, { color: colors.onSurface }]} testID="login-title">EmotiCoach Kids</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceTertiary }]}>
          Daily emotional guidance for parents. Playful learning for kids.
        </Text>

        <View style={{ height: spacing.xl }} />

        <Text style={[styles.label, { color: colors.onSurface }]}>Email</Text>
        <TextInput
          testID="login-email-input"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, { backgroundColor: colors.surfaceTertiary, color: colors.onSurface, borderColor: colors.border }]}
        />

        <Text style={[styles.label, { color: colors.onSurface, marginTop: spacing.lg }]}>Password</Text>
        <TextInput
          testID="login-password-input"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.muted}
          secureTextEntry
          style={[styles.input, { backgroundColor: colors.surfaceTertiary, color: colors.onSurface, borderColor: colors.border }]}
        />

        {err ? <Text style={[styles.err, { color: colors.error }]} testID="login-error">{err}</Text> : null}

        <View style={{ height: spacing.lg }} />
        <Button title="Sign In" onPress={onLogin} loading={loading} testID="login-submit-button" />

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.muted }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <Button
          title="Continue with Google"
          onPress={onGoogle}
          variant="secondary"
          loading={googleLoading}
          testID="login-google-button"
          icon={<Ionicons name="logo-google" size={20} color={colors.onSurfaceSecondary} />}
        />

        <Pressable onPress={() => router.push("/signup")} testID="login-goto-signup" style={{ marginTop: spacing.xl, alignItems: "center" }}>
          <Text style={{ color: colors.onSurfaceTertiary }}>
            New here? <Text style={{ color: colors.brandPrimary, fontWeight: "700" }}>Create an account</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  heroBox: { height: 180, borderRadius: radius.lg, overflow: "hidden", marginBottom: spacing.xl },
  hero: { width: "100%", height: "100%", resizeMode: "cover" },
  title: { fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 16, marginTop: spacing.sm, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: spacing.sm },
  input: { height: 54, borderRadius: radius.md, paddingHorizontal: spacing.lg, borderWidth: 1, fontSize: 16 },
  err: { marginTop: spacing.md, fontSize: 14 },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: spacing.lg, gap: spacing.md },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
});
