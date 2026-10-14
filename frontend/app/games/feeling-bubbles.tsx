import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import Ionicons from "@react-native-vector-icons/ionicons";
import Animated, { ZoomIn, ZoomOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameHeader } from "@/src/components/GameHeader";
import { useTheme, spacing, radius, ThemeColors } from "@/src/theme";
import { Button } from "@/src/components/Button";
import { saveProgress } from "@/src/progress";
import { GameMedal } from "@/src/components/GameMedal";

type K = keyof ThemeColors;
const TARGETS: { feeling: string; color: K }[] = [
  { feeling: "Happy", color: "kidSun" },
  { feeling: "Calm", color: "kidSky" },
  { feeling: "Loved", color: "kidPink" },
  { feeling: "Peaceful", color: "kidLime" },
  { feeling: "Brave", color: "kidOrange" },
];
const ALL: K[] = TARGETS.map((t) => t.color);
const GAME_SECS = 30;
const SIZE = 72;

type Bubble = { id: number; x: number; y: number; color: K };
let nextId = 1;

export default function FeelingBubbles() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [target, setTarget] = useState(TARGETS[0]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(GAME_SECS);
  const [state, setState] = useState<"ready" | "playing" | "done">("ready");
  const scoreRef = useRef(0);

  const spawn = useCallback((tgt: K, w: number, h: number): Bubble[] => {
    if (!w || !h) return [];
    const list: Bubble[] = [];
    const count = 8;
    for (let k = 0; k < count; k++) {
      const color = k < 3 ? tgt : ALL[Math.floor(Math.random() * ALL.length)];
      list.push({ id: nextId++, x: Math.random() * (w - SIZE), y: Math.random() * (h - SIZE), color });
    }
    return list;
  }, []);

  const newRound = useCallback(() => {
    const t = TARGETS[Math.floor(Math.random() * TARGETS.length)];
    setTarget(t);
    setBubbles(spawn(t.color, area.w, area.h));
  }, [area, spawn]);

  useEffect(() => {
    if (state !== "playing") return;
    const id = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(id);
          setState("done");
          saveProgress("feeling-bubbles", scoreRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state]);

  const start = () => {
    scoreRef.current = 0;
    setScore(0);
    setTime(GAME_SECS);
    setState("playing");
    newRound();
  };

  const pop = (b: Bubble) => {
    if (state !== "playing") return;
    if (b.color === target.color) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      scoreRef.current += 1;
      setScore(scoreRef.current);
      const rest = bubbles.filter((x) => x.id !== b.id);
      if (!rest.some((x) => x.color === target.color)) newRound();
      else setBubbles(rest);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setBubbles((list) => list.map((x) => (x.id === b.id ? { ...x, x: Math.random() * (area.w - SIZE), y: Math.random() * (area.h - SIZE) } : x)));
    }
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea({ w: width, h: height });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <GameHeader title="Feeling Bubbles" score={score} color={colors.kidSky} />
      <View style={[styles.targetBar, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <View style={[styles.targetDot, { backgroundColor: colors[target.color] }]} />
        <Text testID="bubbles-target" style={{ flex: 1, color: colors.onSurface, fontSize: 17, fontWeight: "800" }}>
          {state === "playing" ? `Pop the ${target.feeling} bubbles!` : "Pop bubbles of the feeling color"}
        </Text>
        <View style={[styles.timer, { backgroundColor: time <= 5 && state === "playing" ? colors.kidCoral : colors.kidMint }]}>
          <Ionicons name="time" size={14} color={colors.onKid} />
          <Text testID="bubbles-timer" style={{ color: colors.onKid, fontWeight: "900", marginLeft: 4 }}>{time}s</Text>
        </View>
      </View>

      <View style={[styles.area, { backgroundColor: colors.surfaceTertiary }]} onLayout={onLayout} testID="bubbles-area">
        {state === "playing" && bubbles.map((b) => (
          <Animated.View key={b.id} entering={ZoomIn.springify()} exiting={ZoomOut} style={[styles.bubbleWrap, { left: b.x, top: b.y }]}>
            <Pressable testID={`bubble-${b.color}`} onPress={() => pop(b)} style={[styles.bubble, { backgroundColor: colors[b.color] }]}>
              <View style={styles.shine} />
            </Pressable>
          </Animated.View>
        ))}
        {state !== "playing" && (
          <View style={styles.overlay}>
            {state === "done" ? (
              <>
                <GameMedal title="Super bubble popper!" />
                <Text testID="bubbles-result" style={[styles.big, { color: colors.onSurface }]}>{score} pops!</Text>
              </>
            ) : (
              <>
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  {TARGETS.map((t) => <View key={t.color} style={[styles.legendDot, { backgroundColor: colors[t.color] }]} />)}
                </View>
                <Text style={[styles.legend, { color: colors.onSurface }]}>Each color is a feeling.{"\n"}Pop only the matching color!</Text>
              </>
            )}
          </View>
        )}
      </View>

      {state !== "playing" && (
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.lg }}>
          <Button testID="bubbles-start" title={state === "done" ? "Play Again" : "Start Popping"} variant="tertiary" onPress={start} />
        </View>
      )}
      {state === "playing" && <View style={{ height: insets.bottom + spacing.md }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  targetBar: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  targetDot: { width: 36, height: 36, borderRadius: 18 },
  timer: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, height: 32, borderRadius: radius.pill },
  area: { flex: 1, margin: spacing.lg, borderRadius: radius.lg, overflow: "hidden" },
  bubbleWrap: { position: "absolute", width: SIZE, height: SIZE },
  bubble: { width: SIZE, height: SIZE, borderRadius: SIZE / 2 },
  shine: { position: "absolute", top: 12, left: 14, width: 18, height: 12, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.6)" },
  overlay: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  legendDot: { width: 36, height: 36, borderRadius: 18 },
  legend: { fontSize: 18, fontWeight: "800", textAlign: "center", marginTop: spacing.lg, lineHeight: 26 },
  big: { fontSize: 40, fontWeight: "900", marginTop: spacing.md },
});
