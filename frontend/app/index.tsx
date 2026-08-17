import { useEffect } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";

// Layar 01 — Splash. Tampil ~1.8s lalu ke Onboarding.
export default function Splash() {
  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/(auth)/onboarding");
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <View className="flex-1 bg-primary">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1 px-8">
        <View className="flex-1 items-start justify-center">
          <View className="h-16 w-16 items-center justify-center rounded-card bg-surface">
            <Text className="font-archivo-black text-3xl text-primary">V</Text>
          </View>

          <Text className="mt-6 font-archivo-black text-[40px] leading-tight text-white">
            Vitaflux
          </Text>

          <Text className="mt-3 max-w-[85%] font-archivo text-body leading-6 text-white">
            Satu kantong darah, tiga nyawa. Terhubung dengan faskes terdekat.
          </Text>
        </View>

        <View className="pb-6">
          <Text className="mb-3 font-archivo-medium text-caption tracking-overline text-white">
            MEMUAT...
          </Text>
          <View className="h-1.5 w-full overflow-hidden rounded-pill bg-white/25">
            <View className="h-full w-3/5 rounded-pill bg-white" />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
