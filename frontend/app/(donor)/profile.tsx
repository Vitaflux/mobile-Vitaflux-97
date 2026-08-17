import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  View, Text, TextInput, Pressable, Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import * as Location from "expo-location";
import { useAuth } from "../../src/store/auth";
import { updateMyProfile } from "../../src/api/profiles";
import { errorMessage } from "../../src/lib/errorMessage";

const MIN_DAYS = 90;
const GOLONGAN = ["A", "B", "AB", "O"] as const;
const RHESUS = ["+", "-"] as const; // sesuai backend (hyphen)

function daysSince(s: string): number | null {
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

export default function DonorProfile() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const [golongan, setGolongan] = useState<"A" | "B" | "AB" | "O">("O");
  const [rhesus, setRhesus] = useState<"+" | "-">("-");
  const [lastDonation, setLastDonation] = useState("");
  const [coords, setCoords] = useState<[number, number] | null>(null); // [lng, lat]
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  const elig = useMemo(() => {
    const d = daysSince(lastDonation);
    if (d === null) return null;
    const remaining = MIN_DAYS - d;
    return { ok: remaining <= 0, remaining: Math.max(0, remaining), days: d };
  }, [lastDonation]);

  async function useMyLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Izin lokasi", "Aktifkan izin lokasi untuk mengisi titikmu.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setCoords([pos.coords.longitude, pos.coords.latitude]); // GeoJSON [lng, lat]
    } catch (e: any) {
      Alert.alert("Lokasi gagal", errorMessage(e, "Tidak bisa mengambil lokasi."));
    } finally {
      setLocating(false);
    }
  }

  async function onSave() {
    if (!coords) {
      Alert.alert("Lokasi belum ada", "Tekan \u201CGunakan lokasi saya\u201D dulu.");
      return;
    }
    setSaving(true);
    try {
      await updateMyProfile({
        blood_type: golongan,
        rhesus,
        location: { type: "Point", coordinates: coords },
        last_donor: lastDonation || null,
      });
      Alert.alert("Tersimpan", "Profil berhasil disimpan.");
    } catch (e: any) {
      Alert.alert("Gagal simpan", errorMessage(e, "Backend belum tersambung."));
    } finally {
      setSaving(false);
    }
  }

  async function onLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="px-6 pb-10" keyboardShouldPersistTaps="handled">
          <View className="h-12 flex-row items-center">
            <Pressable onPress={() => router.back()} hitSlop={8} className="mr-3">
              <Text className="text-2xl text-ink">←</Text>
            </Pressable>
            <Text className="font-archivo-semibold text-body text-ink">Profil pendonor</Text>
          </View>

          <View className="mt-2 flex-row items-center">
            <View className="mr-4 h-14 w-14 items-center justify-center rounded-card bg-primary">
              <Text className="font-archivo-black text-lg text-white">
                {(user?.name?.[0] ?? user?.email?.[0] ?? "V").toUpperCase()}
              </Text>
            </View>
            <View>
              <Text className="font-archivo-bold text-subjudul text-ink">
                {user?.name ?? user?.email ?? "Pendonor"}
              </Text>
              <Text className="mt-0.5 font-archivo text-caption text-ink-muted">
                Golongan {golongan}{rhesus}
              </Text>
            </View>
          </View>

          <View className={`mt-6 rounded-[18px] border p-5 ${elig?.ok ? "border-primary bg-primary-soft" : "border-line bg-surface"}`}>
            {elig === null ? (
              <Text className="font-archivo text-body text-ink-muted">
                Isi tanggal donor terakhir untuk melihat status kelayakan.
              </Text>
            ) : elig.ok ? (
              <>
                <Text className="font-archivo-black text-subjudul text-primary-dark">Boleh donor sekarang</Text>
                <Text className="mt-1 font-archivo text-caption text-ink-muted">Interval minimum {MIN_DAYS} hari terlampaui.</Text>
              </>
            ) : (
              <>
                <Text className="font-archivo-black text-subjudul text-ink">Boleh donor lagi dalam {elig.remaining} hari</Text>
                <Text className="mt-1 font-archivo text-caption text-ink-muted">{elig.days} dari {MIN_DAYS} hari berlalu.</Text>
              </>
            )}
          </View>

          <Text className="mb-3 mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">DATA PENDONOR</Text>

          <Label>Golongan darah</Label>
          <Seg options={GOLONGAN} value={golongan} onChange={(v) => setGolongan(v as "A" | "B" | "AB" | "O")} />

          <View className="h-4" />
          <Label>Rhesus</Label>
          <Seg options={RHESUS} value={rhesus} onChange={(v) => setRhesus(v as "+" | "-")} />

          <View className="h-4" />
          <Label>Tanggal donor terakhir</Label>
          <TextInput
            value={lastDonation}
            onChangeText={setLastDonation}
            placeholder="YYYY-MM-DD (kosongkan jika belum pernah)"
            placeholderTextColor="#9b9797"
            className={inputCls}
          />

          <View className="h-4" />
          <Label>Lokasi</Label>
          <Pressable onPress={useMyLocation} disabled={locating} className="flex-row items-center justify-center rounded-card border border-line py-[14px]">
            {locating ? (
              <ActivityIndicator color="#EC3013" />
            ) : (
              <Text className="font-archivo-semibold text-body text-ink">
                {coords ? "Perbarui lokasi saya" : "Gunakan lokasi saya"}
              </Text>
            )}
          </Pressable>
          {coords && (
            <Text className="mt-2 font-archivo text-caption text-ink-muted">
              Tersimpan: {coords[1].toFixed(5)}, {coords[0].toFixed(5)} (lat, lng)
            </Text>
          )}

          <Pressable onPress={onSave} disabled={saving} className="mt-7 items-center rounded-pill bg-primary py-4 active:bg-primary-dark">
            {saving ? <ActivityIndicator color="#fff" /> : <Text className="font-archivo-bold text-body text-white">Simpan profil</Text>}
          </Pressable>

          <Pressable onPress={onLogout} className="mt-3 items-center rounded-pill border border-line py-4">
            <Text className="font-archivo-semibold text-body text-ink">Keluar</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const inputCls = "rounded-card border border-line px-4 py-[14px] font-archivo text-body text-ink";

function Label({ children }: { children: ReactNode }) {
  return <Text className="mb-2 font-archivo-medium text-caption text-ink">{children}</Text>;
}

function Seg({ options, value, onChange }: { options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View className="flex-row gap-2">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable key={opt} onPress={() => onChange(opt)} className={`flex-1 items-center rounded-card border py-3 ${active ? "border-primary bg-primary" : "border-line bg-surface"}`}>
            <Text className={`font-archivo-bold text-body ${active ? "text-white" : "text-ink"}`}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}