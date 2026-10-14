import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import Ionicons from "@react-native-vector-icons/ionicons";
import type { PurchasesPackage } from "react-native-purchases";

import { useAuth } from "@/src/auth";
import { useTheme, spacing, radius } from "@/src/theme";
import { apiFetch } from "@/src/api";
import { Button } from "@/src/components/Button";
import { checkoutHtml, openWebCheckout } from "@/src/razorpay";
import { rcEnabled, useSubscription } from "@/lib/revenuecat";

const PERKS = [
  "Every daily emotional guidance video",
  "Premium parenting series",
  "New content added every day",
  "Cancel anytime",
];

function packageLabel(pkg: PurchasesPackage): string {
  const t = pkg.packageType;
  if (t === "ANNUAL") return "YEARLY";
  if (t === "MONTHLY") return "MONTHLY";
  if (t === "WEEKLY") return "WEEKLY";
  if (t === "LIFETIME") return "LIFETIME";
  return pkg.identifier.toUpperCase();
}

export default function Paywall() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, refresh, purchaseIdentityError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [html, setHtml] = useState<string | null>(null);

  const verify = async (r: any) => {
    try {
      await apiFetch("/payments/verify", { method: "POST", body: JSON.stringify(r) });
      await refresh();
      setMsg({ text: "Premium unlocked! Enjoy all videos.", ok: true });
    } catch (e: any) {
      setMsg({ text: e.message || "Verification failed", ok: false });
    }
  };

  const subscribe = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const s = await apiFetch("/payments/subscription", { method: "POST" });
      const opts = { key: s.key_id, subscription_id: s.subscription_id, email: user?.email, name: user?.name };
      if (Platform.OS === "web") {
        const r = await openWebCheckout(opts);
        await verify(r);
      } else {
        setHtml(checkoutHtml(opts));
      }
    } catch (e: any) {
      if (e.message !== "dismissed") setMsg({ text: e.message || "Could not start checkout", ok: false });
    } finally {
      setLoading(false);
    }
  };

  const onMessage = async (ev: any) => {
    let m: any = {};
    try { m = JSON.parse(ev.nativeEvent.data); } catch {}
    setHtml(null);
    if (m.type === "success") await verify(m.data);
    else if (m.type === "failed") setMsg({ text: m.error || "Payment failed", ok: false });
  };

  if (rcEnabled) {
    return <RevenueCatPaywall onDone={() => router.back()} msg={msg} setMsg={setMsg} purchaseIdentityError={purchaseIdentityError} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}>
        <Pressable testID="paywall-close-button" onPress={() => router.back()} style={[styles.close, { backgroundColor: colors.surfaceTertiary }]}>
          <Ionicons name="close" size={24} color={colors.onSurface} />
        </Pressable>
        <View style={[styles.iconWrap, { backgroundColor: colors.brandSecondary }]}>
          <Ionicons name="star" size={48} color={colors.onBrandSecondary} />
        </View>
        <Text style={[styles.title, { color: colors.onSurface }]}>EmotiCoach Premium</Text>
        <Text style={[styles.sub, { color: colors.onSurfaceTertiary }]}>Raise emotionally strong kids with daily expert guidance.</Text>

        <View style={[styles.priceCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.brandPrimary }]}>
          <Text style={{ color: colors.muted, fontWeight: "700" }}>MONTHLY</Text>
          <Text testID="paywall-price" style={[styles.price, { color: colors.onSurface }]}>₹499<Text style={{ fontSize: 16, color: colors.muted }}> / month</Text></Text>
        </View>

        {PERKS.map((p) => (
          <View key={p} style={styles.perk}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={{ color: colors.onSurface, fontSize: 15, marginLeft: spacing.md, flex: 1 }}>{p}</Text>
          </View>
        ))}

        {msg ? (
          <Text testID="paywall-message" style={{ marginTop: spacing.lg, color: msg.ok ? colors.success : colors.error, fontWeight: "700", textAlign: "center" }}>{msg.text}</Text>
        ) : null}
      </ScrollView>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.lg, borderTopWidth: 1, borderTopColor: colors.border }}>
        {user?.premium ? (
          <Button testID="paywall-done-button" title="You're Premium - Continue" variant="tertiary" onPress={() => router.back()} />
        ) : (
          <Button testID="paywall-subscribe-button" title="Subscribe with Razorpay" loading={loading} onPress={subscribe}
            icon={<Ionicons name="lock-closed" size={18} color={colors.onBrandPrimary} />} />
        )}
        <Text style={{ textAlign: "center", color: colors.muted, fontSize: 12, marginTop: spacing.sm }}>Secure payment by Razorpay · UPI, cards, netbanking</Text>
      </View>

      <Modal visible={!!html} animationType="slide" onRequestClose={() => setHtml(null)}>
        <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: colors.surface }}>
          <Pressable testID="checkout-close-button" onPress={() => setHtml(null)} style={{ padding: spacing.lg }}>
            <Ionicons name="close" size={26} color={colors.onSurface} />
          </Pressable>
          {html ? (
            <WebView originWhitelist={["*"]} source={{ html, baseUrl: "https://checkout.razorpay.com" }} onMessage={onMessage} javaScriptEnabled style={{ flex: 1 }} />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  close: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", alignSelf: "flex-end" },
  iconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", alignSelf: "center", marginTop: spacing.md },
  title: { fontSize: 28, fontWeight: "800", textAlign: "center", marginTop: spacing.lg },
  sub: { fontSize: 15, textAlign: "center", marginTop: spacing.sm, lineHeight: 22 },
  priceCard: { borderWidth: 2, borderRadius: radius.lg, padding: spacing.xl, alignItems: "center", marginVertical: spacing.xl },
  price: { fontSize: 40, fontWeight: "800", marginTop: spacing.xs },
  perk: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
});
