import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "../../src/store/auth";

// Placeholder beranda pendonor — isi asli di D-05.
export default function DonorHome() {
  const logout = useAuth((s) => s.logout);
  const user = useAuth((s) => s.user);
  async function onLogout() {
    await logout();
    router.replace("/(auth)/login");
  }
  return (
    <SafeAreaView className="flex-1 bg-ground px-6">
      <View className="flex-1 justify-center">
        <Text className="font-archivo-bold text-judul text-ink">Beranda Pendonor</Text>
        <Text className="mt-2 font-archivo text-body text-ink-muted">
          Halo{user?.email ? `, ${user.email}` : ""} — beranda asli menyusul (D-05).
        </Text>
        <Pressable onPress={onLogout} className="mt-6 items-center rounded-pill border border-line py-3">
          <Text className="font-archivo-semibold text-body text-ink">Keluar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
