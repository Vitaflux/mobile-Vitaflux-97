import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useAuth } from "../../src/store/auth";
import { errorMessage } from "../../src/lib/errorMessage";
import { registerPushTokenForCurrentDevice } from "../../src/lib/pushNotifications";

export default function Login() {
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!email || !password) {
      Alert.alert("Lengkapi data", "Isi email dan kata sandi dulu.");

      return;
    }

    setLoading(true);

    try {
      await login(email.trim(), password);

      const user = useAuth.getState().user;

      // Endpoint push token hanya untuk role donor.
      if (user?.role === "donor") {
        await registerPushTokenForCurrentDevice();
      }

      router.replace(user?.role === "facility" ? "/(facility)" : "/(donor)");
    } catch (error: any) {
      Alert.alert(
        "Login gagal",
        errorMessage(error, "Periksa email/sandi atau koneksi backend."),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1 px-7">
        <View className="pt-10">
          <View className="mb-6 h-14 w-14 items-center justify-center rounded-card bg-primary">
            <Text className="text-xl text-white font-archivo-black">V</Text>
          </View>

          <Text className="font-archivo-black text-display leading-tight text-ink">
            Selamat datang{"\n"}kembali
          </Text>
          <Text className="mt-2 mb-8 font-archivo text-body text-ink-muted">
            Masuk untuk melihat kebutuhan darah di sekitarmu.
          </Text>

          <Text className="mb-2 font-archivo-medium text-caption text-ink">
            Email atau nomor HP
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="nama@email.com"
            placeholderTextColor="#9b9797"
            autoCapitalize="none"
            keyboardType="email-address"
            className="mb-5 h-14 rounded-card border border-line px-4 font-archivo text-body text-ink"
          />

          <Text className="mb-2 font-archivo-medium text-caption text-ink">
            Kata sandi
          </Text>
          <View className="h-14 flex-row items-center rounded-card border border-line px-4">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#9b9797"
              secureTextEntry={!show}
              className="h-full flex-1 font-archivo text-body text-ink"
            />
            <Pressable onPress={() => setShow((v) => !v)} hitSlop={8}>
              <Text className="font-archivo-medium text-caption text-ink-muted">
                {show ? "Sembunyikan" : "Lihat"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => Alert.alert("Lupa kata sandi", "Fitur menyusul.")}
            className="self-end mt-3 mb-6"
            hitSlop={8}
          >
            <Text className="font-archivo-semibold text-caption text-primary-dark">
              Lupa kata sandi?
            </Text>
          </Pressable>

          <Pressable
            onPress={onSubmit}
            disabled={loading}
            className="h-14 items-center justify-center rounded-pill bg-primary active:bg-primary-dark"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-archivo-bold text-body">
                Masuk
              </Text>
            )}
          </Pressable>

          <View className="flex-row items-center my-6">
            <View className="h-[1px] flex-1 bg-line" />
            <Text className="mx-4 font-archivo-medium text-overline tracking-overline text-ink-muted">
              ATAU
            </Text>
            <View className="h-[1px] flex-1 bg-line" />
          </View>

          <Pressable
            onPress={() => Alert.alert("Google", "Login Google menyusul.")}
            className="h-14 items-center justify-center rounded-pill border border-line"
          >
            <Text className="font-archivo-semibold text-body text-ink">
              Lanjut dengan Google
            </Text>
          </Pressable>

        </View>

        <View className="mt-auto flex-row justify-center pb-4 pt-6">
          <Text className="font-archivo text-body text-ink-muted">
            Belum punya akun?{" "}
          </Text>
          <Pressable
            onPress={() => router.push("/(auth)/register")}
            hitSlop={8}
          >
            <Text className="font-archivo-bold text-body text-primary-dark">
              Daftar
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
