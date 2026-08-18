import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function Riwayat() {
  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1">
        <View className="px-6 pt-4">
          <Text className="font-archivo-bold text-judul text-ink">
            Riwayat donor
          </Text>

          <View className="p-5 mt-6 border rounded-card border-line bg-surface">
            <Text className="font-archivo-semibold text-body text-ink">
              Belum ada riwayat
            </Text>

            <Text className="mt-1 font-archivo text-caption text-ink-muted">
              Donasi yang sudah selesai nantinya akan muncul di sini.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
