import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useAuth } from "../../src/store/auth";
import { errorMessage } from "../../src/lib/errorMessage";

type Role = "donor" | "facility";

export default function Register() {
  const register = useAuth((s) => s.register);
  const [role, setRole] = useState<Role>("donor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const donor = role === "donor";
  const nameLabel = donor ? "Nama lengkap" : "Nama fasilitas";
  const namePlaceholder = donor ? "Sesuai KTP" : "Contoh: UDD PMI Kota Bandung";

  async function onSubmit() {
    if (!name || !email || !password) {
      Alert.alert("Lengkapi data", "Nama, email, dan kata sandi wajib diisi.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Kata sandi", "Minimal 8 karakter.");
      return;
    }
    if (!agree) {
      Alert.alert("Persetujuan", "Centang persetujuan Syarat Layanan dulu.");
      return;
    }
    setLoading(true);
    try {
      await register({ email: email.trim(), password, role, name: name.trim() });
      Alert.alert(
        "Akun dibuat",
        "Silakan masuk dengan email dan kata sandimu.",
        [{ text: "Masuk", onPress: () => router.replace("/(auth)/login") }],
      );
    } catch (e: any) {
      Alert.alert(
        "Daftar gagal",
        errorMessage(e, "Periksa data atau koneksi backend."),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerClassName="px-6 pb-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* Top bar */}
          <View className="h-12 flex-row items-center">
            <Pressable onPress={() => router.back()} hitSlop={8} className="mr-3">
              <Text className="text-2xl text-ink">←</Text>
            </Pressable>
            <Text className="font-archivo-semibold text-body text-ink">Buat akun</Text>
          </View>

          <Text className="mt-2 font-archivo-bold text-judul leading-tight text-ink">
            Kamu bergabung{"\n"}sebagai?
          </Text>
          <Text className="mb-5 mt-2 font-archivo text-body text-ink-muted">
            Pilihan ini menentukan tampilan aplikasimu.
          </Text>

          <RoleCard
            selected={donor}
            onPress={() => setRole("donor")}
            icon="V"
            title="Pendonor"
            body="Cari kebutuhan darah yang cocok, daftar donor, simpan riwayat."
          />
          <View className="h-3" />
          <RoleCard
            selected={!donor}
            onPress={() => setRole("facility")}
            icon="+"
            title="Fasilitas Kesehatan"
            body="RS, PMI, atau unit donor. Pasang kebutuhan & kelola jadwal."
          />

          <View className="my-6 h-[1px] bg-line" />

          {/* Nama (label ikut peran) */}
          <Text className="mb-2 font-archivo-medium text-caption text-ink">
            {nameLabel}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={namePlaceholder}
            placeholderTextColor="#9b9797"
            className="mb-5 rounded-card border border-line px-4 py-[14px] font-archivo text-body text-ink"
          />

          <Text className="mb-2 font-archivo-medium text-caption text-ink">Email</Text>
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
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 8 karakter"
            placeholderTextColor="#9b9797"
            secureTextEntry
            className="mb-5 rounded-card border border-line px-4 py-[14px] font-archivo text-body text-ink"
          />

          {/* Persetujuan */}
          <Pressable
            onPress={() => setAgree((v) => !v)}
            className="mb-6 flex-row items-start"
          >
            <View
              className={`mr-3 mt-0.5 h-5 w-5 items-center justify-center rounded-sm border ${
                agree ? "border-primary bg-primary" : "border-line bg-surface"
              }`}
            >
              {agree && <Text className="text-xs text-white">✓</Text>}
            </View>
            <Text className="flex-1 font-archivo text-caption leading-5 text-ink-muted">
              Saya menyetujui Syarat Layanan dan Kebijakan Privasi Vitaflux.
            </Text>
          </Pressable>

          {/* Submit */}
          <Pressable
            onPress={onSubmit}
            disabled={loading}
            className="items-center rounded-pill bg-primary py-4 active:bg-primary-dark"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-archivo-bold text-body text-white">
                {donor ? "Buat akun pendonor" : "Buat akun faskes"}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function RoleCard({
  selected,
  onPress,
  icon,
  title,
  body,
}: {
  selected: boolean;
  onPress: () => void;
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-start rounded-[18px] border p-4 ${
        selected ? "border-primary bg-primary-soft" : "border-line bg-surface"
      }`}
    >
      <View
        className={`mr-3 h-10 w-10 items-center justify-center rounded-card ${
          selected ? "bg-primary" : "bg-ground"
        }`}
      >
        <Text
          className={`font-archivo-black text-lg ${
            selected ? "text-white" : "text-ink-muted"
          }`}
        >
          {icon}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-archivo-bold text-body text-ink">{title}</Text>
        <Text className="mt-1 font-archivo text-caption leading-5 text-ink-muted">
          {body}
        </Text>
      </View>
      <View
        className={`ml-2 mt-1 h-5 w-5 items-center justify-center rounded-pill border ${
          selected ? "border-primary" : "border-line"
        }`}
      >
        {selected && <View className="h-2.5 w-2.5 rounded-pill bg-primary" />}
      </View>
    </Pressable>
  );
}
