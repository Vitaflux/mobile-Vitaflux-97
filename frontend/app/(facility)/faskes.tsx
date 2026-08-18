import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../src/store/auth";

export default function FacilityProfile() {
  const user = useAuth((state) => state.user);

  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1">
        <View className="px-6 pt-4">
          <Text className="font-archivo-bold text-judul text-ink">Faskes</Text>

          <Text className="mt-1 font-archivo text-caption text-ink-muted">
            Profil fasilitas kesehatan
          </Text>

          <View className="p-5 mt-6 border rounded-card border-line bg-surface">
            <Text className="font-archivo-bold text-subjudul text-ink">
              {user?.name ?? "Fasilitas Kesehatan"}
            </Text>

            <View className="self-start px-3 py-1 mt-3 rounded-pill bg-primary-soft">
              <Text className="font-archivo-bold text-overline tracking-overline text-primary-dark">
                TERVERIFIKASI
              </Text>
            </View>

            <Text className="mt-4 leading-5 font-archivo text-caption text-ink-muted">
              Informasi lengkap fasilitas, statistik donasi, penanggung jawab,
              dan kontak akan tersedia setelah profil faskes terhubung ke
              backend.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
