import { useEffect, useState } from "react";
import type { ReactNode } from "react";
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
import * as Location from "expo-location";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CalendarDays,
  LogOut,
  MapPin,
  Pencil,
} from "lucide-react-native";
import { useAuth } from "../../src/store/auth";
import { getMyProfile, updateMyProfile } from "../../src/api/profiles";
import { errorMessage } from "../../src/lib/errorMessage";
import { registerPushTokenForCurrentDevice } from "../../src/lib/pushNotifications";
import type { BloodType, Rhesus } from "../../src/types/models";

const GOLONGAN: BloodType[] = ["A", "B", "AB", "O"];

const RHESUS: Rhesus[] = ["+", "-"];

const RADII = [5, 10, 20] as const;

function dateInput(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function validOptionalDate(value: string) {
  if (!value) {
    return true;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}

export default function DonorProfile() {
  const user = useAuth((state) => state.user);

  const logout = useAuth((state) => state.logout);

  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => getMyProfile(),
    retry: false,
  });

  const [golongan, setGolongan] = useState<BloodType>("O");

  const [rhesus, setRhesus] = useState<Rhesus>("+");

  const [birthDate, setBirthDate] = useState("");

  const [weight, setWeight] = useState("");

  const [city, setCity] = useState("");

  const [radiusKm, setRadiusKm] = useState(10);

  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);

  const [locating, setLocating] = useState(false);

  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const profile = profileQuery.data;

    if (!profile) {
      return;
    }

    setGolongan(profile.blood_type);

    setRhesus(profile.rhesus);

    setBirthDate(dateInput(profile.birth_date));

    setWeight(profile.weight_kg ? String(profile.weight_kg) : "");

    setCity(profile.city ?? "");

    setRadiusKm(profile.notify_radius_km ?? 10);

    setCoordinates(profile.location.coordinates);
  }, [profileQuery.data]);

  const eligibility = profileQuery.data?.eligibility ?? null;

  const totalDonations = profileQuery.data?.stats?.total_donations ?? 0;

  const memberSince = profileQuery.data?.stats?.member_since_year;

  async function useMyLocation() {
    setLocating(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "Izin lokasi",
          "Aktifkan izin lokasi untuk mengisi titik lokasimu.",
        );

        return;
      }

      const position = await Location.getCurrentPositionAsync({});

      setCoordinates([position.coords.longitude, position.coords.latitude]);
    } catch (error: any) {
      Alert.alert(
        "Lokasi gagal",
        errorMessage(error, "Tidak bisa mengambil lokasi."),
      );
    } finally {
      setLocating(false);
    }
  }

  async function onSave() {
    if (!coordinates) {
      Alert.alert(
        "Lokasi belum ada",
        "Tekan Gunakan lokasi saya terlebih dahulu.",
      );

      return;
    }

    if (!validOptionalDate(birthDate)) {
      Alert.alert("Tanggal lahir tidak valid", "Gunakan format YYYY-MM-DD.");

      return;
    }

    const parsedWeight = weight ? Number(weight) : null;

    if (
      parsedWeight !== null &&
      (!Number.isFinite(parsedWeight) || parsedWeight <= 0)
    ) {
      Alert.alert(
        "Berat badan tidak valid",
        "Masukkan berat badan dalam kilogram.",
      );

      return;
    }

    setSaving(true);

    try {
      await updateMyProfile({
        blood_type: golongan,
        rhesus,
        location: {
          type: "Point",
          coordinates,
        },
        birth_date: birthDate || null,
        weight_kg: parsedWeight,
        city: city.trim() || null,
        notify_radius_km: radiusKm,
      });

      // Profil donor sekarang pasti tersedia, jadi beri registrasi push yang
      // gagal saat login kesempatan deterministik untuk mencoba sekali lagi.
      void registerPushTokenForCurrentDevice();

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["profile"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["my-profile"],
        }),
      ]);

      setEditing(false);

      Alert.alert("Tersimpan", "Profil berhasil diperbarui.");
    } catch (error: any) {
      Alert.alert(
        "Gagal menyimpan profil",
        errorMessage(error, "Coba lagi atau periksa koneksi."),
      );
    } finally {
      setSaving(false);
    }
  }

  function onCancelEdit() {
    const profile = profileQuery.data;

    if (profile) {
      setGolongan(profile.blood_type);
      setRhesus(profile.rhesus);
      setBirthDate(dateInput(profile.birth_date));
      setWeight(profile.weight_kg ? String(profile.weight_kg) : "");
      setCity(profile.city ?? "");
      setRadiusKm(profile.notify_radius_km ?? 10);
      setCoordinates(profile.location.coordinates);
    }

    setEditing(false);
  }

  async function onLogout() {
    await logout();

    router.replace("/(auth)/login");
  }

  if (profileQuery.isLoading) {
    return (
      <View className="items-center justify-center flex-1 bg-ground">
        <ActivityIndicator color="#EC3013" />

        <Text className="mt-3 font-archivo text-caption text-ink-muted">
          Memuat profil...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerClassName="px-6 pb-10"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pt-3">
            <Text className="font-archivo-black text-judul text-ink">
              Profil
            </Text>

            {!editing ? (
              <Pressable
                onPress={() => setEditing(true)}
                hitSlop={8}
                className="items-center justify-center w-11 h-11 border rounded-pill border-line bg-surface"
              >
                <Pencil color="#201E1D" size={19} />
              </Pressable>
            ) : null}
          </View>

          {/* Identity */}
          <View className="flex-row items-center mt-5">
            <View className="items-center justify-center w-16 h-16 mr-4 rounded-pill bg-primary-tint">
              <Text className="font-archivo-black text-subjudul text-primary-dark">
                {(user?.name?.[0] ?? user?.email?.[0] ?? "V").toUpperCase()}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="font-archivo-black text-judul text-ink">
                {user?.name ?? user?.email ?? "Pendonor"}
              </Text>

              <Text className="mt-0.5 font-archivo text-caption text-ink-muted">
                {city || "Kota domisili belum diisi"}
              </Text>

              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                {memberSince
                  ? `Pendonor sejak ${memberSince}`
                  : "Tahun bergabung belum tersedia"}
              </Text>
            </View>
          </View>

          {/* Statistics */}
          <View className="flex-row gap-3 mt-5">
            <View className="flex-1 p-4 border rounded-card border-line bg-surface">
              <Text className="font-archivo-black text-judul text-primary">
                {golongan}
                {rhesus}
              </Text>

              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                Golongan darah
              </Text>
            </View>

            <View className="flex-1 p-4 border rounded-card border-line bg-surface">
              <Text className="font-archivo-black text-judul text-ink">
                {totalDonations}
              </Text>

              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                Total donasi
              </Text>
            </View>
          </View>

          {/* Eligibility */}
          <View
            className={`mt-4 rounded-[18px] border p-5 ${
              eligibility?.is_eligible
                ? "border-primary bg-primary-soft"
                : "border-line bg-surface"
            }`}
          >
            {eligibility === null ? (
              <Text className="font-archivo text-body text-ink-muted">
                Status kelayakan belum tersedia dari profil donor.
              </Text>
            ) : eligibility.is_eligible ? (
              <>
                <Text className="font-archivo-black text-subjudul text-primary-dark">
                  Boleh donor sekarang
                </Text>

                <Text className="mt-1 font-archivo text-caption text-ink-muted">
                  Status kelayakan dikonfirmasi oleh sistem Vitaflux.
                </Text>
              </>
            ) : (
              <>
                <Text className="font-archivo-black text-subjudul text-ink">
                  Boleh donor lagi dalam {eligibility.remaining_days} hari
                </Text>

                <Text className="mt-1 font-archivo text-caption text-ink-muted">
                  Perkiraan tanggal: {dateInput(eligibility.eligible_at)}
                </Text>
              </>
            )}
          </View>

          {editing ? (
            <>
              <Text className="mb-3 mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
                EDIT DATA PENDONOR
              </Text>

          {/* Blood */}
          <Label>Golongan darah</Label>

          <Segment
            options={GOLONGAN}
            value={golongan}
            onChange={(value) => setGolongan(value as BloodType)}
          />

          <View className="h-4" />

          <Label>Rhesus</Label>

          <Segment
            options={RHESUS}
            value={rhesus}
            onChange={(value) => setRhesus(value as Rhesus)}
          />

          {/* Birth date */}
          <View className="h-4" />

          <Label>Tanggal lahir</Label>

          <TextInput
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9B9797"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            className={inputClass}
          />

          {/* Weight */}
          <View className="h-4" />

          <Label>Berat badan</Label>

          <View className="flex-row items-center">
            <TextInput
              value={weight}
              onChangeText={setWeight}
              placeholder="Contoh: 60"
              placeholderTextColor="#9B9797"
              keyboardType="decimal-pad"
              className={`${inputClass} flex-1`}
            />

            <Text className="ml-3 font-archivo-semibold text-body text-ink-muted">
              kg
            </Text>
          </View>

          {/* City */}
          <View className="h-4" />

          <Label>Kota domisili</Label>

          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="Contoh: Cilegon"
            placeholderTextColor="#9B9797"
            autoCapitalize="words"
            className={inputClass}
          />

          {/* Last donation */}
          <View className="h-4" />

          <Label>Tanggal donor terakhir</Label>

          <View className="flex-row items-center">
            <CalendarDays color="#605D5D" size={20} />

            <View className={`${inputClass} flex-1 ml-3`}>
              <Text className="font-archivo text-body text-ink">
                {profileQuery.data?.last_donor
                  ? dateInput(profileQuery.data.last_donor)
                  : "Belum ada donasi selesai"}
              </Text>
            </View>
          </View>

          {/* Radius */}
          <View className="h-4" />

          <Label>Radius notifikasi</Label>

          <View className="flex-row gap-2">
            {RADII.map((radius) => {
              const active = radiusKm === radius;

              return (
                <Pressable
                  key={radius}
                  onPress={() => setRadiusKm(radius)}
                  className={`flex-1 items-center rounded-card border py-3 ${
                    active
                      ? "border-primary bg-primary"
                      : "border-line bg-surface"
                  }`}
                >
                  <Text
                    className={`font-archivo-bold text-body ${
                      active ? "text-white" : "text-ink"
                    }`}
                  >
                    {radius} km
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Location */}
          <View className="h-4" />

          <Label>Lokasi</Label>

          <Pressable
            onPress={useMyLocation}
            disabled={locating}
            className="flex-row items-center justify-center rounded-card border border-line bg-surface py-[14px]"
          >
            {locating ? (
              <ActivityIndicator color="#EC3013" />
            ) : (
              <>
                <MapPin color="#201E1D" size={20} />

                <Text className="ml-2 font-archivo-semibold text-body text-ink">
                  {coordinates ? "Perbarui lokasi saya" : "Gunakan lokasi saya"}
                </Text>
              </>
            )}
          </Pressable>

          {coordinates ? (
            <Text className="mt-2 font-archivo text-caption text-ink-muted">
              Tersimpan: {coordinates[1].toFixed(5)},{" "}
              {coordinates[0].toFixed(5)} (lat, lng)
            </Text>
          ) : null}

          {/* Actions */}
              <View className="flex-row gap-3 mt-7">
                <Pressable
                  onPress={onCancelEdit}
                  disabled={saving}
                  className="items-center px-6 py-4 border rounded-pill border-line bg-surface"
                >
                  <Text className="font-archivo-semibold text-body text-ink">
                    Batal
                  </Text>
                </Pressable>

                <Pressable
                  onPress={onSave}
                  disabled={saving}
                  className="items-center flex-1 py-4 rounded-pill bg-primary active:bg-primary-dark"
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-archivo-bold text-body">
                      Simpan profil
                    </Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text className="mb-3 mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
                DATA PENDONOR
              </Text>

              <View className="overflow-hidden border rounded-card border-line bg-surface">
                <ProfileRow
                  label="Tanggal lahir"
                  value={birthDate || "Belum diisi"}
                />

                <ProfileRow
                  label="Berat badan"
                  value={weight ? `${weight} kg` : "Belum diisi"}
                />

                <ProfileRow
                  label="Kota domisili"
                  value={city || "Belum diisi"}
                />

                <ProfileRow
                  label="Donor terakhir"
                  value={
                    profileQuery.data?.last_donor
                      ? dateInput(profileQuery.data.last_donor)
                      : "Belum ada donasi selesai"
                  }
                />

                <ProfileRow
                  label="Radius notifikasi"
                  value={`${radiusKm} km`}
                />

                <ProfileRow
                  label="Lokasi"
                  value={coordinates ? "Lokasi tersimpan" : "Belum diisi"}
                  last
                />
              </View>
            </>
          )}

          <Pressable
            onPress={() => router.push("/(donor)/pengingat")}
            className="flex-row items-center justify-center py-4 mt-3 border rounded-pill border-primary bg-primary-soft"
          >
            <Bell color="#A31B0A" size={20} />

            <Text className="ml-2 font-archivo-bold text-body text-primary-dark">
              Atur pengingat donor
            </Text>
          </Pressable>

          <Pressable
            onPress={onLogout}
            className="flex-row items-center justify-center py-4 mt-3 border rounded-pill border-line bg-surface"
          >
            <LogOut color="#201E1D" size={20} />

            <Text className="ml-2 font-archivo-semibold text-body text-ink">
              Keluar
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const inputClass =
  "rounded-card border border-line bg-surface px-4 py-[14px] font-archivo text-body text-ink";

function ProfileRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-4 ${
        last ? "" : "border-b border-line"
      }`}
    >
      <Text className="font-archivo text-caption text-ink-muted">{label}</Text>

      <Text className="ml-4 text-right font-archivo-semibold text-caption text-ink">
        {value}
      </Text>
    </View>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <Text className="mb-2 font-archivo-medium text-caption text-ink">
      {children}
    </Text>
  );
}

function Segment({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View className="flex-row gap-2">
      {options.map((option) => {
        const active = option === value;

        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            className={`flex-1 items-center rounded-card border py-3 ${
              active ? "border-primary bg-primary" : "border-line bg-surface"
            }`}
          >
            <Text
              className={`font-archivo-bold text-body ${
                active ? "text-white" : "text-ink"
              }`}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
