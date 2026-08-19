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
import { useAuth } from "../../src/store/auth";
import {
  addEligibilityToCalendar,
  cancelDonorReminder,
  scheduleDonorReminder,
  syncDonorReminderEligibility,
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
  const userId = useAuth((state) => state.user?.id);
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
    if (!userId || !profileQuery.isSuccess) {
      return;
    }

    const reminderUserId = userId;
    let active = true;

    async function loadReminder() {
      try {
        const storedReminder = await syncDonorReminderEligibility(
          reminderUserId,
          eligibleAt,
        );

        if (active) {
          setReminder(storedReminder);
        }
      } catch {
        if (active) {
          setReminder(null);
        }
      } finally {
        if (active) {
          setLoadingReminder(false);
        }
      }
    }

    loadReminder();

    return () => {
      active = false;
    };
  }, [eligibleAt, profileQuery.isSuccess, userId]);

  async function onSchedule() {
    if (!userId || !eligibleAt) {
      Alert.alert(
        "Jadwal belum tersedia",
        "Lengkapi tanggal donor terakhir pada halaman profil.",
      );
      return;
    }

    setScheduling(true);

    try {
      const result = await scheduleDonorReminder(userId, eligibleAt, timing);

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
            if (!userId) {
              return;
            }

            setRemoving(true);

            try {
              await cancelDonorReminder(userId);
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

          {reminder && !loadingReminder ? (
            <View className="mt-4">
              <View className="items-center justify-center w-16 h-16 rounded-sheet bg-primary">
                <Bell color="#FFFFFF" size={30} />
              </View>

              <Text className="mt-5 font-archivo-black text-display text-ink">
                Pengingat aktif
              </Text>

              <Text className="mt-2 leading-6 font-archivo text-body text-ink-muted">
                Kamu akan diingatkan sebelum jadwal donor berikutnya.
              </Text>
            </View>
          ) : (
            <>
              <Text className="mt-3 font-archivo-black text-judul text-ink">
                Atur Pengingat Donor Berikutnya
              </Text>

              <Text className="mt-2 leading-6 font-archivo text-body text-ink-muted">
                Pilih kapan aplikasi mengingatkan jadwal kelayakan donormu.
              </Text>
            </>
          )}

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
              <View className="p-5 mt-6 border rounded-sheet border-line bg-surface">
                <View className="flex-row items-center">
                  <View className="items-center justify-center w-12 h-12 mr-4 rounded-card bg-primary-soft">
                    <CalendarDays color="#A31B0A" size={24} />
                  </View>

                  <View className="flex-1">
                    <Text className="font-archivo-bold text-overline tracking-overline text-ink-muted">
                      BOLEH DONOR LAGI
                    </Text>

                    <Text className="mt-1 font-archivo-black text-body text-ink">
                      {formatDate(eligibleAt)}
                    </Text>
                  </View>
                </View>

                {!eligibleAt ? (
                  <View className="p-4 mt-4 border rounded-card border-line bg-ground">
                    <Text className="font-archivo text-caption text-ink-muted">
                      Tanggal kelayakan belum tersedia. Isi tanggal donor
                      terakhir terlebih dahulu di halaman Profil.
                    </Text>

                    <Pressable
                      onPress={() => router.push("/(donor)/profile")}
                      className="items-center py-3 mt-4 border rounded-pill border-line bg-surface"
                    >
                      <Text className="font-archivo-semibold text-body text-ink">
                        Buka Profil
                      </Text>
                    </Pressable>
                  </View>
                ) : null}

                <View className="h-px my-5 bg-line" />

                {/* Pengingat aktif */}
                {loadingReminder ? (
                  <View className="items-center py-5">
                    <ActivityIndicator color="#EC3013" />
                  </View>
                ) : reminder ? (
                  <View className="flex-row items-start">
                    <View className="items-center justify-center w-10 h-10 mr-3 rounded-card bg-primary-soft">
                      <Check color="#A31B0A" size={21} />
                    </View>

                    <View className="flex-1">
                      <Text className="font-archivo-bold text-overline tracking-overline text-ink-muted">
                        NOTIFIKASI APLIKASI
                      </Text>

                      <Text className="mt-1 font-archivo-bold text-body text-ink">
                        {formatDateTime(reminder.scheduledFor)}
                      </Text>

                      <Text className="mt-1 font-archivo text-caption text-primary-dark">
                        {reminder.timing === "h-3"
                          ? "3 hari sebelum jadwal donor"
                          : "Pada hari kelayakan donor"}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View>
                    <Text className="font-archivo-bold text-overline tracking-overline text-ink-muted">
                      NOTIFIKASI APLIKASI
                    </Text>

                    <Text className="mt-1 font-archivo text-caption text-ink-muted">
                      Belum ada pengingat aktif.
                    </Text>
                  </View>
                )}

                {/* Pilihan waktu */}
                <Text className="mt-6 font-archivo-bold text-overline tracking-overline text-ink-muted">
                  KAPAN DIINGATKAN
                </Text>

                <View className="flex-row gap-2 mt-3">
                  {OPTIONS.map((option) => {
                    const active = timing === option.value;

                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setTiming(option.value)}
                        className={`flex-1 items-center rounded-card border px-3 py-3 ${
                          active
                            ? "border-primary bg-primary"
                            : "border-line bg-surface"
                        }`}
                      >
                        <Text
                          className={`text-center font-archivo-bold text-caption ${
                            active ? "text-white" : "text-ink"
                          }`}
                        >
                          {option.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text className="mt-2 font-archivo text-caption text-ink-muted">
                  {OPTIONS.find((option) => option.value === timing)?.description}
                </Text>

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
                        {reminder
                          ? "Perbarui pengingat"
                          : "Aktifkan pengingat"}
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
              </View>

              {reminder && !loadingReminder ? (
                <Pressable
                  onPress={onCancelReminder}
                  disabled={removing}
                  className="flex-row items-center justify-center py-3 mt-3"
                >
                  {removing ? (
                    <ActivityIndicator color="#A31B0A" />
                  ) : (
                    <>
                      <Trash2 color="#A31B0A" size={18} />

                      <Text className="ml-2 font-archivo-semibold text-caption text-primary-dark">
                        Hapus pengingat
                      </Text>
                    </>
                  )}
                </Pressable>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
