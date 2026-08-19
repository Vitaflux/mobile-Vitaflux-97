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
import Constants from "expo-constants";
import { GOOGLE_WEB_CLIENT_ID } from "../../src/config/env";

export default function Login() {
  const login = useAuth((s) => s.login);

  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const loginWithGoogle = useAuth((s) => s.loginWithGoogle);

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

  async function onGoogleLogin() {
    if (Constants.appOwnership === "expo") {
      Alert.alert(
        "Development build diperlukan",
        "Google Login memakai modul native dan tidak dapat dijalankan melalui Expo Go.",
      );
      return;
    }
    if (!GOOGLE_WEB_CLIENT_ID) {
      Alert.alert(
        "Google Login belum dikonfigurasi",
        "Isi EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID lalu build ulang aplikasi.",
      );
      return;
    }

    setGoogleLoading(true);
    try {
      const { GoogleSignin } =
        await import("@react-native-google-signin/google-signin");
      GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const response = await GoogleSignin.signIn();
      if (response.type !== "success") return;
      if (!response.data.idToken) {
        throw new Error("Google tidak mengirim ID token.");
      }

      queryClient.clear();
      const next = await loginWithGoogle(response.data.idToken);
      if (next === "onboarding") {
        router.push("/(auth)/google-onboarding");
        return;
      }

      const user = useAuth.getState().user;
      if (!user)
        throw new Error("Data pengguna tidak ditemukan setelah login.");
      if (user.role === "donor") {
        try {
          await registerPushTokenForCurrentDevice();
        } catch (pushError) {
          console.warn("Push token belum dapat didaftarkan:", pushError);
        }
      }
      router.replace(user.role === "facility" ? "/(facility)" : "/(donor)");
    } catch (error) {
      Alert.alert(
        "Google Login gagal",
        errorMessage(error, "Silakan coba lagi."),
      );
    } finally {
      setGoogleLoading(false);
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

          <View className="flex-row items-center my-6">
            <View className="h-[1px] flex-1 bg-line" />
            <Text className="mx-4 font-archivo-medium text-overline tracking-overline text-ink-muted">
              ATAU
            </Text>
            <View className="h-[1px] flex-1 bg-line" />
          </View>

          <Pressable
            onPress={onGoogleLogin}
            disabled={googleLoading}
            className="items-center justify-center py-4 border rounded-pill border-line"
          >
            {googleLoading ? (
              <ActivityIndicator color="#EC3013" />
            ) : (
              <Text className="font-archivo-semibold text-body text-ink">
                Lanjut dengan Google
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
