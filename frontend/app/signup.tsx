import { View, Text, StyleSheet, TextInput, ScrollView, Platform, KeyboardAvoidingView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";

import { useAuth } from "@/src/auth";
import { useTheme, spacing, radius } from "@/src/theme";
import { Button } from "@/src/components/Button";

export default function Signup() {
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async () => {
    setErr(null);
    if (password.length < 6) return setErr("Password must be at least 6 characters");
    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim() || email.split("@")[0]);
    } catch (e: any) {
      setErr(e.message || "Sign up failed");
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.surface }}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl, paddingHorizontal: spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} testID="signup-back-button" style={{ alignSelf: "flex-start", marginBottom: spacing.lg }}>
          <Ionicons name="chevron-back" size={28} color={colors.onSurface} />
        </Pressable>

        <Text style={[styles.title, { color: colors.onSurface }]}>Create account</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceTertiary }]}>Free. No credit card needed.</Text>

        <View style={{ height: spacing.xl }} />

        <Text style={[styles.label, { color: colors.onSurface }]}>Full name</Text>
        <TextInput
          testID="signup-name-input"
          value={name}
          onChangeText={setName}
          placeholder="Jane Parker"
          placeholderTextColor={colors.muted}
          style={[styles.input, { backgroundColor: colors.surfaceTertiary, color: colors.onSurface, borderColor: colors.border }]}
        />

        <Text style={[styles.label, { color: colors.onSurface, marginTop: spacing.lg }]}>Email</Text>
        <TextInput
          testID="signup-email-input"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={colors.muted}
          style={[styles.input, { backgroundColor: colors.surfaceTertiary, color: colors.onSurface, borderColor: colors.border }]}
        />

        <Text style={[styles.label, { color: colors.onSurface, marginTop: spacing.lg }]}>Password</Text>
        <TextInput
          testID="signup-password-input"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          secureTextEntry
          placeholderTextColor={colors.muted}
          style={[styles.input, { backgroundColor: colors.surfaceTertiary, color: colors.onSurface, borderColor: colors.border }]}
        />

        {err ? <Text style={[styles.err, { color: colors.error }]} testID="signup-error">{err}</Text> : null}

        <View style={{ height: spacing.lg }} />
        <Button title="Create Account" onPress={onSubmit} loading={loading} testID="signup-submit-button" />

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.muted }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <Button
          title="Continue with Google"
          onPress={signInWithGoogle}
          variant="secondary"
          testID="signup-google-button"
          icon={<Ionicons name="logo-google" size={20} color={colors.onSurfaceSecondary} />}
        />

        <Pressable onPress={() => router.replace("/login")} testID="signup-goto-login" style={{ marginTop: spacing.xl, alignItems: "center" }}>
          <Text style={{ color: colors.onSurfaceTertiary }}>
            Already have an account? <Text style={{ color: colors.brandPrimary, fontWeight: "700" }}>Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 16, marginTop: spacing.sm },
  label: { fontSize: 14, fontWeight: "600", marginBottom: spacing.sm },
  input: { height: 54, borderRadius: radius.md, paddingHorizontal: spacing.lg, borderWidth: 1, fontSize: 16 },
  err: { marginTop: spacing.md, fontSize: 14 },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: spacing.lg, gap: spacing.md },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
});
