import { Pressable, Text, StyleSheet, ActivityIndicator, View } from "react-native";
import { ReactNode } from "react";
import { useTheme, radius, spacing } from "../theme";

type Variant = "primary" | "secondary" | "tertiary" | "ghost";

export function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
  testID,
  fullWidth = true,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  testID?: string;
  fullWidth?: boolean;
}) {
  const { colors } = useTheme();
  const bg =
    variant === "primary" ? colors.brandPrimary
    : variant === "secondary" ? colors.surfaceSecondary
    : variant === "tertiary" ? colors.brandTertiary
    : "transparent";
  const fg =
    variant === "primary" ? colors.onBrandPrimary
    : variant === "secondary" ? colors.onSurfaceSecondary
    : variant === "tertiary" ? colors.onBrandTertiary
    : colors.onSurface;
  const border = variant === "secondary" ? colors.border : "transparent";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant === "secondary" ? 1.5 : 0,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          width: fullWidth ? "100%" : undefined,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          {icon}
          <Text style={[styles.text, { color: fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 56,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  text: { fontSize: 16, fontWeight: "700" },
});
