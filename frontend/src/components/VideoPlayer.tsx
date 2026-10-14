import { View, Text, Pressable, Platform, StyleSheet, Linking } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { WebView } from "react-native-webview";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useTheme } from "../theme";

function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?playsinline=1`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

function NativeVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => { p.loop = false; });
  return <VideoView testID="video-player" player={player} style={StyleSheet.absoluteFill} nativeControls contentFit="contain" />;
}

export function VideoPlayer({ url }: { url: string }) {
  const { colors } = useTheme();
  const embed = embedUrl(url);
  if (embed) {
    if (Platform.OS === "web") {
      return (
        <Pressable testID="video-open-external" onPress={() => Linking.openURL(url)} style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: colors.surfaceInverse }]}>
          <Ionicons name="logo-youtube" size={56} color={colors.onSurfaceInverse} />
          <Text style={{ color: colors.onSurfaceInverse, marginTop: 8, fontWeight: "700" }}>Tap to watch</Text>
        </Pressable>
      );
    }
    return (
      <View testID="video-embed" style={StyleSheet.absoluteFill}>
        <WebView source={{ uri: embed }} allowsFullscreenVideo allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false} style={{ flex: 1, backgroundColor: "#000" }} />
      </View>
    );
  }
  return <NativeVideo uri={url} />;
}

const styles = StyleSheet.create({ center: { alignItems: "center", justifyContent: "center" } });
