import { useEffect, useMemo, useState } from "react";
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
import { CalendarDays, LogOut, MapPin } from "lucide-react-native";
import { useAuth } from "../../src/store/auth";
import { getMyProfile, updateMyProfile } from "../../src/api/profiles";
import { errorMessage } from "../../src/lib/errorMessage";
import type { BloodType, Rhesus } from "../../src/types/models";
import { Bell } from "lucide-react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

const MIN_DAYS = 90;

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

function daysSince(value: string): number | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
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

  const profileKey = ["profile", user?.email ?? "guest"] as const;

  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);

  const [showLastDonationPicker, setShowLastDonationPicker] = useState(false);

  const profileQuery = useQuery({
    queryKey: profileKey,
    queryFn: getMyProfile,
    enabled: Boolean(user),
    retry: false,
    refetchOnMount: "always",
  });

  const [golongan, setGolongan] = useState<BloodType>("O");

  const [rhesus, setRhesus] = useState<Rhesus>("+");

  const [birthDate, setBirthDate] = useState("");

  const [weight, setWeight] = useState("");

  const [city, setCity] = useState("");

  const [lastDonation, setLastDonation] = useState("");

  const [radiusKm, setRadiusKm] = useState(10);

  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);

  const [locating, setLocating] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    /*
     * Kosongkan tampilan terlebih dahulu ketika akun berubah,
     * agar profil akun sebelumnya tidak sempat terlihat.
     */
    setGolongan("O");
    setRhesus("+");
    setBirthDate("");
    setWeight("");
    setCity("");
    setLastDonation("");
    setRadiusKm(10);
    setCoordinates(null);
  }, [user?.email]);

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

    setLastDonation(dateInput(profile.last_donor));

    setRadiusKm(profile.notify_radius_km ?? 10);

    setCoordinates(profile.location.coordinates);
  }, [profileQuery.data]);

  const eligibility = useMemo(() => {
    const elapsed = daysSince(lastDonation);

    if (elapsed === null) {
      return null;
    }

    const remaining = MIN_DAYS - elapsed;

    return {
      eligible: remaining <= 0,
      remaining: Math.max(0, remaining),
      elapsed,
    };
  }, [lastDonation]);

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

  function onBirthDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    setShowBirthDatePicker(false);

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    setBirthDate(dateInput(selectedDate.toISOString()));
  }

  function onLastDonationChange(
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) {
    setShowLastDonationPicker(false);

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    setLastDonation(dateInput(selectedDate.toISOString()));
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

    if (!validOptionalDate(lastDonation)) {
      Alert.alert("Tanggal donor tidak valid", "Gunakan format YYYY-MM-DD.");

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
        last_donor: lastDonation || null,
        notify_radius_km: radiusKm,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["profile"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["my-profile"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["matching-bloods"],
        }),
      ]);

      await profileQuery.refetch();

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

  async function onLogout() {
    try {
      await logout();

      /*
       * Hapus profil, riwayat, kebutuhan, dan data akun lama
       * dari cache React Query.
       */
      queryClient.clear();

      router.replace("/(auth)/login");
    } catch (error: any) {
      Alert.alert("Gagal keluar", errorMessage(error, "Coba lagi."));
    }
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
          <View className="flex-row items-center h-12">
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              className="mr-3"
            >
              <Text className="text-2xl text-ink">←</Text>
            </Pressable>

            <Text className="font-archivo-semibold text-body text-ink">
              Profil pendonor
            </Text>
          </View>

          {/* Identity */}
          <View className="flex-row items-center mt-2">
            <View className="items-center justify-center mr-4 h-14 w-14 rounded-card bg-primary">
              <Text className="text-lg text-white font-archivo-black">
                {(user?.name?.[0] ?? user?.email?.[0] ?? "V").toUpperCase()}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="font-archivo-bold text-subjudul text-ink">
                {user?.name ?? user?.email ?? "Pendonor"}
              </Text>

              <Text className="mt-0.5 font-archivo text-caption text-ink-muted">
                Golongan {golongan}
                {rhesus}
              </Text>

              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                {memberSince
                  ? `Pendonor sejak ${memberSince}`
                  : "Tahun bergabung belum tersedia"}
              </Text>
            </View>
          </View>

          {/* Statistics */}
          <View className="flex-row gap-3 mt-6">
            <View className="flex-1 p-4 border rounded-card border-line bg-surface">
              <Text className="font-archivo-black text-judul text-primary">
                {totalDonations}
              </Text>

              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                Total donasi
              </Text>
            </View>

            <View className="flex-1 p-4 border rounded-card border-line bg-surface">
              <Text className="font-archivo-black text-judul text-ink">
                {memberSince ?? "-"}
              </Text>

              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                Sejak tahun
              </Text>
            </View>
          </View>

          {/* Eligibility */}
          <View
            className={`mt-4 rounded-[18px] border p-5 ${
              eligibility?.eligible
                ? "border-primary bg-primary-soft"
                : "border-line bg-surface"
            }`}
          >
            {eligibility === null ? (
              <Text className="font-archivo text-body text-ink-muted">
                Isi tanggal donor terakhir untuk melihat status kelayakan.
              </Text>
            ) : eligibility.eligible ? (
              <>
                <Text className="font-archivo-black text-subjudul text-primary-dark">
                  Boleh donor sekarang
                </Text>

                <Text className="mt-1 font-archivo text-caption text-ink-muted">
                  Interval minimum {MIN_DAYS} hari sudah terlampaui.
                </Text>
              </>
            ) : (
              <>
                <Text className="font-archivo-black text-subjudul text-ink">
                  Boleh donor lagi dalam {eligibility.remaining} hari
                </Text>

                <Text className="mt-1 font-archivo text-caption text-ink-muted">
                  {eligibility.elapsed} dari {MIN_DAYS} hari berlalu.
                </Text>
              </>
            )}
          </View>

          <Text className="mb-3 mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
            DATA PENDONOR
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
          {/* Birth date */}
          <View className="h-4" />

          <Label>Tanggal lahir</Label>

          <Pressable
            onPress={() => setShowBirthDatePicker(true)}
            className="flex-row items-center rounded-card border border-line bg-surface px-4 py-[14px]"
          >
            <CalendarDays color="#605D5D" size={20} />

            <Text
              className={`ml-3 flex-1 font-archivo text-body ${
                birthDate ? "text-ink" : "text-ink-muted"
              }`}
            >
              {birthDate || "Pilih tanggal lahir"}
            </Text>
          </Pressable>

          {showBirthDatePicker ? (
            <DateTimePicker
              value={
                birthDate
                  ? new Date(`${birthDate}T12:00:00`)
                  : new Date(2000, 0, 1)
              }
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={onBirthDateChange}
            />
          ) : null}

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
          {/* Last donation */}
          <View className="h-4" />

          <Label>Tanggal donor terakhir</Label>

          <Pressable
            onPress={() => setShowLastDonationPicker(true)}
            className="flex-row items-center rounded-card border border-line bg-surface px-4 py-[14px]"
          >
            <CalendarDays color="#605D5D" size={20} />

            <Text
              className={`ml-3 flex-1 font-archivo text-body ${
                lastDonation ? "text-ink" : "text-ink-muted"
              }`}
            >
              {lastDonation || "Pilih tanggal donor terakhir"}
            </Text>
          </Pressable>

          {lastDonation ? (
            <Pressable
              onPress={() => setLastDonation("")}
              className="self-start px-1 py-2 mt-1"
            >
              <Text className="font-archivo-semibold text-caption text-primary-dark">
                Kosongkan tanggal
              </Text>
            </Pressable>
          ) : null}

          {showLastDonationPicker ? (
            <DateTimePicker
              value={
                lastDonation ? new Date(`${lastDonation}T12:00:00`) : new Date()
              }
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={onLastDonationChange}
            />
          ) : null}

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
          <Pressable
            onPress={onSave}
            disabled={saving}
            className="items-center py-4 mt-7 rounded-pill bg-primary active:bg-primary-dark"
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-archivo-bold text-body">
                Simpan profil
              </Text>
            )}
          </Pressable>

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
