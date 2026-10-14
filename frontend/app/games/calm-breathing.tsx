import { View, Text, StyleSheet } from "react-native";
import { useEffect, useRef, useState } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, cancelAnimation } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameHeader } from "@/src/components/GameHeader";
import { useTheme, spacing } from "@/src/theme";
import { Button } from "@/src/components/Button";
import { saveProgress } from "@/src/progress";

const PHASES = [
  { label: "Breathe In", secs: 4, scale: 1.6 },
  { label: "Hold", secs: 4, scale: 1.6 },
  { label: "Breathe Out", secs: 4, scale: 1 },
];
const TOTAL_CYCLES = 3;

export default function CalmBreathing() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [count, setCount] = useState(PHASES[0].secs);
  const [cycle, setCycle] = useState(0);
  const timer = useRef<any>(null);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    if (!running) return;
    const p = PHASES[phase];
    scale.value = withTiming(p.scale, { duration: p.secs * 1000, easing: Easing.inOut(Easing.ease) });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCount(p.secs);
    let c = p.secs;
    timer.current = setInterval(() => {
      c -= 1;
      setCount(c);
      if (c <= 0) {
        clearInterval(timer.current);
        const nextPhase = (phase + 1) % PHASES.length;
        if (nextPhase === 0) {
          const nc = cycle + 1;
          setCycle(nc);
          if (nc >= TOTAL_CYCLES) {
            setRunning(false);
            saveProgress("calm-breathing", nc);
            return;
          }
        }
        setPhase(nextPhase);
      }
    }, 1000);
    return () => clearInterval(timer.current);
  }, [running, phase]);

  const start = () => { setCycle(0); setPhase(0); setRunning(true); };
  const stop = () => { setRunning(false); clearInterval(timer.current); cancelAnimation(scale); scale.value = withTiming(1); };
  const finished = !running && cycle >= TOTAL_CYCLES;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <GameHeader title="Calm Breathing" color={colors.kidMint} />
      <View style={styles.center}>
        <Animated.View style={[styles.balloon, { backgroundColor: [colors.kidSky, colors.kidPink, colors.kidLime][phase] }, style]}>
          <Text testID="breathing-count" style={[styles.count, { color: colors.onKid }]}>{running ? count : ""}</Text>
        </Animated.View>
        <Text testID="breathing-phase" style={[styles.phase, { color: colors.onSurface }]}>
          {running ? PHASES[phase].label : finished ? "You did it! Feel calm." : "Ready to relax?"}
        </Text>
        <Text style={{ color: colors.muted, marginTop: spacing.sm }}>Cycle {Math.min(cycle + (running ? 1 : 0), TOTAL_CYCLES)} of {TOTAL_CYCLES}</Text>
      </View>
      <View style={{ padding: spacing.xl, paddingBottom: insets.bottom + spacing.xl }}>
        {running
          ? <Button testID="breathing-stop" title="Stop" variant="secondary" onPress={stop} />
          : <Button testID="breathing-start" title={finished ? "Breathe Again" : "Start"} variant="tertiary" onPress={start} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  balloon: { width: 150, height: 150, borderRadius: 75, alignItems: "center", justifyContent: "center", marginBottom: 80 },
  count: { fontSize: 40, fontWeight: "800" },
  phase: { fontSize: 28, fontWeight: "800" },
});
