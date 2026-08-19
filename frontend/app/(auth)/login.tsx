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
import { useQueryClient } from "@tanstack/react-query";

export default function Login() {
  const login = useAuth((s) => s.login);

  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      Alert.alert("Lengkapi data", "Isi email dan kata sandi dulu.");
      return;
    }

    setLoading(true);

    try {
      /*
       * Bersihkan semua data akun sebelumnya sebelum membuat
       * sesi login baru.
       */
      queryClient.clear();

      await login(normalizedEmail, password);

      const loggedInUser = useAuth.getState().user;

      if (!loggedInUser) {
        throw new Error("Data pengguna tidak ditemukan setelah login.");
      }

      if (loggedInUser.role === "donor") {
        try {
          await registerPushTokenForCurrentDevice();
        } catch (pushError) {
          /*
           * Kegagalan push notification tidak boleh menggagalkan login.
           */
          console.warn("Push token belum dapat didaftarkan:", pushError);
        }
      }

      router.replace(
        loggedInUser.role === "facility" ? "/(facility)" : "/(donor)",
      );
    } catch (error: any) {
      /*
       * Pastikan tidak ada cache dari percobaan login yang gagal.
       */
      queryClient.clear();

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
      <SafeAreaView className="flex-1 px-6">
        <View className="justify-center flex-1">
          <View className="items-center justify-center w-12 h-12 mb-6 rounded-card bg-primary">
            <Text className="text-xl text-white font-archivo-black">V</Text>
          </View>

          <Text className="leading-tight font-archivo-bold text-judul text-ink">
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
            className="mb-5 rounded-card border border-line px-4 py-[14px] font-archivo text-body text-ink"
          />

          <Text className="mb-2 font-archivo-medium text-caption text-ink">
            Kata sandi
          </Text>
          <View className="flex-row items-center px-4 border rounded-card border-line">
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
            className="items-center py-4 rounded-pill bg-primary active:bg-primary-dark"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-archivo-bold text-body">
                Masuk
              </Text>
            )}
          </Pressable>

          <View className="flex-row justify-center mt-6">
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
        </View>
      </SafeAreaView>
    </View>
  );
}
