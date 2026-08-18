import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarDays, Check, Clock3, Trash2 } from "lucide-react-native";

import { getMyProfile } from "../../src/api/profiles";
import { errorMessage } from "../../src/lib/errorMessage";
import {
  addEligibilityToCalendar,
  cancelDonorReminder,
  getDonorReminder,
  scheduleDonorReminder,
} from "../../src/lib/donorReminder";
import type {
  DonorReminder,
  ReminderTiming,
} from "../../src/lib/donorReminder";

const OPTIONS: {
  value: ReminderTiming;
  title: string;
  description: string;
}[] = [
  {
    value: "h-3",
    title: "3 hari sebelumnya",
    description: "Ingatkan tiga hari sebelum kamu boleh donor lagi.",
  },
  {
    value: "day",
    title: "Pada hari donor",
    description: "Ingatkan pukul 09.00 saat kamu sudah boleh donor.",
  },
];

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DonorReminderScreen() {
  const [timing, setTiming] = useState<ReminderTiming>("h-3");
  const [reminder, setReminder] = useState<DonorReminder | null>(null);
  const [loadingReminder, setLoadingReminder] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [addingCalendar, setAddingCalendar] = useState(false);
  const [removing, setRemoving] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
  });

  const eligibleAt = profileQuery.data?.eligibility?.eligible_at ?? null;

  useEffect(() => {
    async function loadReminder() {
      try {
        const storedReminder = await getDonorReminder();
        setReminder(storedReminder);
      } catch {
        setReminder(null);
      } finally {
        setLoadingReminder(false);
      }
    }

    loadReminder();
  }, []);

  async function onSchedule() {
    if (!eligibleAt) {
      Alert.alert(
        "Jadwal belum tersedia",
        "Lengkapi tanggal donor terakhir pada halaman profil.",
      );
      return;
    }

    setScheduling(true);

    try {
      const result = await scheduleDonorReminder(eligibleAt, timing);

      setReminder(result);

      Alert.alert(
        "Pengingat aktif",
        `Notifikasi dijadwalkan pada ${formatDateTime(result.scheduledFor)}.`,
      );
    } catch (error: any) {
      Alert.alert(
        "Gagal membuat pengingat",
        errorMessage(error, "Tidak dapat menjadwalkan notifikasi."),
      );
    } finally {
      setScheduling(false);
    }
  }

  async function onAddCalendar() {
    if (!eligibleAt) {
      Alert.alert(
        "Jadwal belum tersedia",
        "Lengkapi tanggal donor terakhir pada halaman profil.",
      );
      return;
    }

    setAddingCalendar(true);

    try {
      await addEligibilityToCalendar(eligibleAt);
    } catch (error: any) {
      Alert.alert(
        "Kalender gagal dibuka",
        errorMessage(error, "Tidak dapat menambahkan jadwal ke kalender."),
      );
    } finally {
      setAddingCalendar(false);
    }
  }

  function onCancelReminder() {
    Alert.alert(
      "Hapus pengingat?",
      "Notifikasi donor yang aktif akan dibatalkan.",
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            setRemoving(true);

            try {
              await cancelDonorReminder();
              setReminder(null);
              Alert.alert("Dihapus", "Pengingat donor telah dibatalkan.");
            } catch (error: any) {
              Alert.alert(
                "Gagal menghapus",
                errorMessage(error, "Pengingat tidak dapat dihapus."),
              );
            } finally {
              setRemoving(false);
            }
          },
        },
      ],
    );
  }

  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="px-6 pb-10">
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
              Pengingat donor
            </Text>
          </View>

          <Text className="mt-3 font-archivo-bold text-judul text-ink">
            Jangan lewatkan jadwal donor berikutnya
          </Text>

          <Text className="mt-2 leading-6 font-archivo text-body text-ink-muted">
            Aktifkan notifikasi lokal atau tambahkan jadwal kelayakan donor ke
            kalender HP.
          </Text>

          {/* Jadwal kelayakan */}
          {profileQuery.isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator color="#EC3013" />

              <Text className="mt-3 font-archivo text-caption text-ink-muted">
                Memuat jadwal kelayakan...
              </Text>
            </View>
          ) : profileQuery.isError ? (
            <View className="p-5 mt-6 border rounded-card border-line bg-surface">
              <Text className="font-archivo-bold text-body text-ink">
                Jadwal belum dapat dimuat
              </Text>

              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                Periksa koneksi lalu coba lagi.
              </Text>

              <Pressable
                onPress={() => profileQuery.refetch()}
                className="items-center py-3 mt-4 rounded-pill bg-primary"
              >
                <Text className="text-white font-archivo-bold text-body">
                  Coba lagi
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text className="mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
                BOLEH DONOR LAGI
              </Text>

              <View className="p-5 mt-3 border rounded-card border-primary bg-primary-soft">
                <View className="flex-row items-center">
                  <View className="items-center justify-center w-12 h-12 mr-4 rounded-card bg-primary">
                    <CalendarDays color="#FFFFFF" size={24} />
                  </View>

                  <View className="flex-1">
                    <Text className="font-archivo-bold text-body text-primary-dark">
                      {formatDate(eligibleAt)}
                    </Text>

                    <Text className="mt-1 font-archivo text-caption text-ink-muted">
                      Berdasarkan tanggal donor terakhir dan interval kelayakan.
                    </Text>
                  </View>
                </View>
              </View>

              {!eligibleAt ? (
                <View className="p-4 mt-3 border rounded-card border-line bg-surface">
                  <Text className="font-archivo text-caption text-ink-muted">
                    Tanggal kelayakan belum tersedia. Isi tanggal donor terakhir
                    terlebih dahulu di halaman Profil.
                  </Text>

                  <Pressable
                    onPress={() => router.push("/(donor)/profile")}
                    className="items-center py-3 mt-4 border rounded-pill border-line"
                  >
                    <Text className="font-archivo-semibold text-body text-ink">
                      Buka Profil
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {/* Pengingat aktif */}
              <Text className="mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
                PENGINGAT AKTIF
              </Text>

              {loadingReminder ? (
                <View className="items-center py-8">
                  <ActivityIndicator color="#EC3013" />
                </View>
              ) : reminder ? (
                <View className="p-5 mt-3 border rounded-card border-primary bg-surface">
                  <View className="flex-row items-start">
                    <View className="items-center justify-center w-10 h-10 mr-3 rounded-pill bg-primary">
                      <Bell color="#FFFFFF" size={20} />
                    </View>

                    <View className="flex-1">
                      <Text className="font-archivo-bold text-body text-ink">
                        Notifikasi sudah dijadwalkan
                      </Text>

                      <Text className="mt-1 leading-5 font-archivo text-caption text-ink-muted">
                        {formatDateTime(reminder.scheduledFor)}
                      </Text>

                      <Text className="mt-1 font-archivo text-caption text-primary-dark">
                        {reminder.timing === "h-3"
                          ? "3 hari sebelum jadwal donor"
                          : "Pada hari kelayakan donor"}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={onCancelReminder}
                    disabled={removing}
                    className="flex-row items-center justify-center py-3 mt-4 border rounded-pill border-line"
                  >
                    {removing ? (
                      <ActivityIndicator color="#A31B0A" />
                    ) : (
                      <>
                        <Trash2 color="#A31B0A" size={18} />

                        <Text className="ml-2 font-archivo-semibold text-body text-primary-dark">
                          Hapus pengingat
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              ) : (
                <View className="p-5 mt-3 border rounded-card border-line bg-surface">
                  <Text className="font-archivo-bold text-body text-ink">
                    Belum ada pengingat
                  </Text>

                  <Text className="mt-1 font-archivo text-caption text-ink-muted">
                    Pilih waktu notifikasi di bawah untuk mengaktifkannya.
                  </Text>
                </View>
              )}

              {/* Pilihan waktu */}
              <Text className="mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
                WAKTU NOTIFIKASI
              </Text>

              <View className="gap-3 mt-3">
                {OPTIONS.map((option) => {
                  const active = timing === option.value;

                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setTiming(option.value)}
                      className={`flex-row items-start rounded-card border p-4 ${
                        active
                          ? "border-primary bg-primary-soft"
                          : "border-line bg-surface"
                      }`}
                    >
                      <View
                        className={`mr-3 mt-0.5 h-6 w-6 items-center justify-center rounded-pill border ${
                          active
                            ? "border-primary bg-primary"
                            : "border-line bg-surface"
                        }`}
                      >
                        {active ? <Check color="#FFFFFF" size={15} /> : null}
                      </View>

                      <View className="flex-1">
                        <Text className="font-archivo-bold text-body text-ink">
                          {option.title}
                        </Text>

                        <Text className="mt-1 leading-5 font-archivo text-caption text-ink-muted">
                          {option.description}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Aktifkan */}
              <Pressable
                onPress={onSchedule}
                disabled={scheduling || !eligibleAt}
                className={`flex-row items-center justify-center py-4 mt-6 rounded-pill ${
                  scheduling || !eligibleAt
                    ? "bg-primary/60"
                    : "bg-primary active:bg-primary-dark"
                }`}
              >
                {scheduling ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Bell color="#FFFFFF" size={20} />

                    <Text className="ml-2 text-white font-archivo-bold text-body">
                      {reminder ? "Perbarui pengingat" : "Aktifkan pengingat"}
                    </Text>
                  </>
                )}
              </Pressable>

              {/* Kalender */}
              <Pressable
                onPress={onAddCalendar}
                disabled={addingCalendar || !eligibleAt}
                className="flex-row items-center justify-center py-4 mt-3 border rounded-pill border-line bg-surface"
              >
                {addingCalendar ? (
                  <ActivityIndicator color="#EC3013" />
                ) : (
                  <>
                    <Clock3 color="#201E1D" size={20} />

                    <Text className="ml-2 font-archivo-bold text-body text-ink">
                      Tambahkan ke kalender HP
                    </Text>
                  </>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
