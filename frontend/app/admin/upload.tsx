import { View, Text, StyleSheet, TextInput, Pressable, Switch, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import * as DocumentPicker from "expo-document-picker";
import { useQueryClient } from "@tanstack/react-query";
import Ionicons from "@react-native-vector-icons/ionicons";

import { useTheme, spacing, radius } from "@/src/theme";
import { apiFetch, uploadFile } from "@/src/api";
import { Button } from "@/src/components/Button";

export default function UploadVideo() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"url" | "upload">("url");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [thumb, setThumb] = useState("");
  const [premium, setPremium] = useState(false);
  const [file, setFile] = useState<{ uri: string; name: string; mimeType?: string; size?: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const inputStyle = [styles.input, { backgroundColor: colors.surfaceTertiary, color: colors.onSurface, borderColor: colors.border }];

  const pick = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: "video/*", copyToCacheDirectory: true });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      setFile({ uri: a.uri, name: a.name, mimeType: a.mimeType, size: a.size });
    }
  };

  const save = async () => {
    setErr(null);
    if (!title.trim()) return setErr("Title is required");
    if (mode === "url" && !url.trim()) return setErr("Video URL is required");
    if (mode === "upload" && !file) return setErr("Pick a video file");
    setSaving(true);
    try {
      let storage_path: string | null = null;
      if (mode === "upload" && file) {
        const up = await uploadFile(file.uri, file.name, file.mimeType || "video/mp4");
        storage_path = up.path;
      }
      await apiFetch("/videos", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          url: mode === "url" ? url.trim() : null,
          storage_path,
          thumbnail_url: thumb.trim() || null,
          is_premium: premium,
          source_type: mode,
        }),
      });
      qc.invalidateQueries();
      if (router.canGoBack()) router.back();
      else router.replace("/admin");
    } catch (e: any) {
      setErr(e.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.border }]}>
        <Pressable testID="upload-close-button" onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surfaceTertiary }]}>
          <Ionicons name="close" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>New Video</Text>
      </View>
      <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xl }}>
        <View style={[styles.seg, { backgroundColor: colors.surfaceTertiary }]}>
          {(["url", "upload"] as const).map((m) => (
            <Pressable key={m} testID={`upload-mode-${m}`} onPress={() => setMode(m)} style={[styles.segBtn, mode === m && { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name={m === "url" ? "link" : "cloud-upload"} size={18} color={mode === m ? colors.brandPrimary : colors.muted} />
              <Text style={{ marginLeft: 6, fontWeight: "700", color: mode === m ? colors.onSurface : colors.muted }}>{m === "url" ? "Paste Link" : "Upload File"}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.onSurface }]}>Title</Text>
        <TextInput testID="upload-title-input" value={title} onChangeText={setTitle} placeholder="e.g. Handling Tantrums Calmly" placeholderTextColor={colors.muted} style={inputStyle} />

        <Text style={[styles.label, { color: colors.onSurface }]}>Description</Text>
        <TextInput testID="upload-description-input" value={description} onChangeText={setDescription} placeholder="What will parents learn?" placeholderTextColor={colors.muted} multiline style={[inputStyle, { height: 100, paddingTop: spacing.md, textAlignVertical: "top" }]} />

        {mode === "url" ? (
          <>
            <Text style={[styles.label, { color: colors.onSurface }]}>Video URL (YouTube, Vimeo or MP4)</Text>
            <TextInput testID="upload-url-input" value={url} onChangeText={setUrl} placeholder="https://youtube.com/watch?v=..." autoCapitalize="none" placeholderTextColor={colors.muted} style={inputStyle} />
          </>
        ) : (
          <>
            <Text style={[styles.label, { color: colors.onSurface }]}>Video file</Text>
            <Pressable testID="upload-pick-file" onPress={pick} style={[styles.picker, { borderColor: colors.borderStrong, backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name={file ? "checkmark-circle" : "film-outline"} size={32} color={file ? colors.success : colors.muted} />
              <Text testID="upload-file-name" style={{ color: colors.onSurface, marginTop: spacing.sm, fontWeight: "600" }} numberOfLines={1}>
                {file ? file.name : "Tap to choose an MP4"}
              </Text>
              {file?.size ? <Text style={{ color: colors.muted, fontSize: 12 }}>{(file.size / 1024 / 1024).toFixed(1)} MB</Text> : null}
            </Pressable>
          </>
        )}

        <Text style={[styles.label, { color: colors.onSurface }]}>Thumbnail image URL (optional)</Text>
        <TextInput testID="upload-thumb-input" value={thumb} onChangeText={setThumb} placeholder="https://..." autoCapitalize="none" placeholderTextColor={colors.muted} style={inputStyle} />

        <View style={[styles.switchRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.onSurface, fontWeight: "700" }}>Premium only</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Only subscribers can watch</Text>
          </View>
          <Switch testID="upload-premium-switch" value={premium} onValueChange={setPremium} trackColor={{ true: colors.brandPrimary, false: colors.borderStrong }} thumbColor={Platform.OS === "android" ? colors.surfaceSecondary : undefined} />
        </View>

        {err ? <Text testID="upload-error" style={{ color: colors.error, marginTop: spacing.md }}>{err}</Text> : null}
        <View style={{ height: spacing.lg }} />
        <Button testID="upload-submit-button" title={saving ? (mode === "upload" ? "Uploading…" : "Saving…") : "Publish Video"} loading={saving} onPress={save} />
        <View style={{ height: insets.bottom }} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800" },
  seg: { flexDirection: "row", borderRadius: radius.pill, padding: 4, marginBottom: spacing.md },
  segBtn: { flex: 1, height: 44, borderRadius: radius.pill, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  label: { fontSize: 14, fontWeight: "600", marginBottom: spacing.sm, marginTop: spacing.lg },
  input: { height: 52, borderRadius: radius.md, paddingHorizontal: spacing.lg, borderWidth: 1, fontSize: 16 },
  picker: { borderWidth: 2, borderStyle: "dashed", borderRadius: radius.lg, padding: spacing.xl, alignItems: "center" },
  switchRow: { flexDirection: "row", alignItems: "center", padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, marginTop: spacing.xl },
});
