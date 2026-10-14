import { Tabs } from "expo-router";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useTheme } from "@/src/theme";
import { useAppMode } from "@/src/mode";
import { Platform } from "react-native";

export default function TabsLayout() {
  const { colors } = useTheme();
  const { mode } = useAppMode();
  const kidsMode = mode === "kids";
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surfaceSecondary,
          borderTopColor: colors.border,
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: "Videos",
          tabBarIcon: ({ color, size }) => <Ionicons name="play-circle" size={size} color={color} />,
          // Hidden while a kid is using Kids Mode — protects parent-only content.
          href: kidsMode ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: "Kids",
          tabBarIcon: ({ color, size }) => <Ionicons name="game-controller" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
          // Hidden while a kid is using Kids Mode — protects admin/payment settings.
          href: kidsMode ? null : undefined,
        }}
      />
    </Tabs>
  );
}
