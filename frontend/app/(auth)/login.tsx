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
      const role = useAuth.getState().user?.role;
      router.replace(role === "facility" ? "/(facility)" : "/(donor)");
    } catch (e: any) {
      Alert.alert(
        "Login gagal",
        e?.response?.data?.message ?? "Periksa email/sandi atau koneksi backend.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1 px-6">
        <View className="flex-1 justify-center">
          <View className="mb-6 h-12 w-12 items-center justify-center rounded-card bg-primary">
            <Text className="font-archivo-black text-xl text-white">V</Text>
          </View>

          <Text className="font-archivo-bold text-judul leading-tight text-ink">
            Selamat datang{"\n"}kembali
          </Text>
          <Text className="mb-8 mt-2 font-archivo text-body text-ink-muted">
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
            className="mb-5 rounded-card border border-line px-4 py-[14px] font-archivo text-body text-ink"
          />

          <Text className="mb-2 font-archivo-medium text-caption text-ink">
            Kata sandi
          </Text>
          <View className="flex-row items-center rounded-card border border-line px-4">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#9b9797"
              secureTextEntry={!show}
              className="flex-1 py-[14px] font-archivo text-body text-ink"
            />
            <Pressable onPress={() => setShow((v) => !v)} hitSlop={8}>
              <Text className="font-archivo-medium text-caption text-ink-muted">
                {show ? "Sembunyikan" : "Lihat"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => Alert.alert("Lupa kata sandi", "Fitur menyusul.")}
            className="mb-6 mt-3 self-end"
            hitSlop={8}
          >
            <Text className="font-archivo-semibold text-caption text-primary-dark">
              Lupa kata sandi?
            </Text>
          </Pressable>

          <Pressable
            onPress={onSubmit}
            disabled={loading}
            className="items-center rounded-pill bg-primary py-4 active:bg-primary-dark"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-archivo-bold text-body text-white">Masuk</Text>
            )}
          </Pressable>

          <View className="my-6 flex-row items-center">
            <View className="h-[1px] flex-1 bg-line" />
            <Text className="mx-4 font-archivo-medium text-overline tracking-overline text-ink-muted">
              ATAU
            </Text>
            <View className="h-[1px] flex-1 bg-line" />
          </View>

          <Pressable
            onPress={() => Alert.alert("Google", "Login Google menyusul.")}
            className="items-center justify-center rounded-pill border border-line py-4"
          >
            <Text className="font-archivo-semibold text-body text-ink">
              Lanjut dengan Google
            </Text>
          </Pressable>

          <View className="mt-6 flex-row justify-center">
            <Text className="font-archivo text-body text-ink-muted">
              Belum punya akun?{" "}
            </Text>
            <Pressable onPress={() => router.push("/(auth)/register")} hitSlop={8}>
              <Text className="font-archivo-bold text-body text-primary-dark">
                Daftar
              </Text>
            </Pressable>
          </View>

          {/* DEV — pratinjau layar tanpa backend. Hapus sebelum demo. */}
          <View className="mt-4 flex-row justify-center gap-6">
            <Pressable onPress={() => router.replace("/(donor)/profile")} hitSlop={8}>
              <Text className="font-archivo-medium text-caption text-ink-muted">
                DEV · Donor
              </Text>
            </Pressable>
            <Pressable onPress={() => router.replace("/(facility)")} hitSlop={8}>
              <Text className="font-archivo-medium text-caption text-ink-muted">
                DEV · Faskes
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
