import { useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Droplets,
  HeartPulse,
  RotateCcw,
} from "lucide-react-native";

import { myRequests } from "../../src/api/requests";

type BloodComponent = "whole_blood" | "plasma" | "trombosit" | "eritrosit";

type HistoryRequest = {
  id: string;
  status: "done";
  checked_in_at?: string | null;
  volume_ml?: number | null;
  blood?: {
    id: string;
    blood_type: string;
    rhesus: string;
    quantity: number;
    schedule?: string;
    title?: string | null;
    component?: BloodComponent | null;
  } | null;
  hospital?: {
    hospital_name: string;
    address?: string | null;
  } | null;
};

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const BULAN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const COMPONENT_LABEL: Record<BloodComponent, string> = {
  whole_blood: "Darah utuh",
  plasma: "Plasma",
  trombosit: "Trombosit",
  eritrosit: "Eritrosit",
};

function formatDate(value?: string | null) {
  if (!value) return "Tanggal belum tersedia";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tanggal belum tersedia";
  }

  return `${HARI[date.getDay()]}, ${date.getDate()} ${
    BULAN[date.getMonth()]
  } ${date.getFullYear()}`;
}

function getHistoryTime(history: HistoryRequest) {
  const value = history.checked_in_at ?? history.blood?.schedule;

  if (!value) return 0;

  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
}

function formatComponent(component?: BloodComponent | null) {
  if (!component) return "Belum dicatat";

  return COMPONENT_LABEL[component];
}

function formatVolume(volume?: number | null) {
  if (!volume || volume <= 0) return "Belum dicatat";

  return `${volume.toLocaleString("id-ID")} ml`;
}

function formatLiter(volumeMl: number) {
  if (volumeMl <= 0) return "0";

  return (volumeMl / 1000).toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

export default function Riwayat() {
  const [flipped, setFlipped] = useState(false);
  const flipValue = useRef(new Animated.Value(0)).current;

  const q = useQuery({
    queryKey: ["my-requests", "done"],
    queryFn: () => myRequests("done"),
  });

  const histories = ([...(q.data ?? [])] as HistoryRequest[]).sort(
    (first, second) => getHistoryTime(second) - getHistoryTime(first),
  );

  const totalDonations = histories.length;

  // Backend saat ini menghitung satu donasi selesai sebagai satu nyawa terbantu.
  const livesHelped = totalDonations;

  const totalVolumeMl = histories.reduce(
    (total, history) => total + (history.volume_ml ?? 0),
    0,
  );

  const latestHistory = histories[0] ?? null;

  function toggleCard() {
    const nextFlipped = !flipped;

    setFlipped(nextFlipped);

    Animated.spring(flipValue, {
      toValue: nextFlipped ? 1 : 0,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }

  const frontRotation = flipValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const backRotation = flipValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerClassName="px-6 pb-10"
          refreshControl={
            <RefreshControl
              refreshing={q.isFetching}
              onRefresh={() => q.refetch()}
            />
          }
        >
          <Text className="pt-4 font-archivo-bold text-judul text-ink">
            Riwayat donor
          </Text>

          <Text className="mt-1 font-archivo text-caption text-ink-muted">
            Donasi yang sudah selesai dan tercatat.
          </Text>

          {q.isLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator color="#EC3013" />

              <Text className="mt-3 font-archivo text-caption text-ink-muted">
                Memuat riwayat donor...
              </Text>
            </View>
          ) : q.isError ? (
            <View className="p-5 mt-6 border rounded-card border-line bg-surface">
              <Text className="font-archivo-bold text-body text-ink">
                Riwayat belum dapat dimuat
              </Text>

              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                Periksa koneksi lalu coba lagi.
              </Text>

              <Pressable
                onPress={() => q.refetch()}
                className="items-center py-3 mt-4 rounded-pill bg-primary"
              >
                <Text className="text-white font-archivo-bold text-body">
                  Coba lagi
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Kartu donor digital */}
              <Text className="mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
                KARTU DONOR DIGITAL
              </Text>

              <Pressable
                onPress={toggleCard}
                className="relative h-[230px] mt-3"
              >
                {/* Sisi depan */}
                <Animated.View
                  className="absolute inset-0 overflow-hidden border bg-primary rounded-[22px] border-primary"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: [
                      { perspective: 1000 },
                      { rotateY: frontRotation },
                    ],
                  }}
                >
                  <View className="absolute w-40 h-40 rounded-pill -right-12 -top-14 bg-white/10" />

                  <View className="absolute w-32 h-32 rounded-pill -bottom-16 -left-10 bg-white/10" />

                  <View className="justify-between flex-1 p-6">
                    <View className="flex-row items-start justify-between">
                      <View>
                        <Text className="text-white font-archivo-black text-subjudul">
                          VITAFLUX
                        </Text>

                        <Text className="mt-1 text-white/80 font-archivo-bold text-overline tracking-overline">
                          KARTU DONOR DIGITAL
                        </Text>
                      </View>

                      <Droplets color="#FFFFFF" size={32} />
                    </View>

                    <View>
                      <Text className="font-archivo-black text-[42px] leading-[48px] text-white">
                        {totalDonations}
                      </Text>

                      <Text className="text-white font-archivo-bold text-body">
                        Donasi selesai
                      </Text>

                      <Text className="mt-1 text-white/80 font-archivo text-caption">
                        Terakhir:{" "}
                        {formatDate(
                          latestHistory?.checked_in_at ??
                            latestHistory?.blood?.schedule,
                        )}
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <RotateCcw color="#FFFFFF" size={15} />

                      <Text className="ml-2 text-white/90 font-archivo text-caption">
                        Ketuk untuk melihat dampak donasimu
                      </Text>
                    </View>
                  </View>
                </Animated.View>

                {/* Sisi belakang */}
                <Animated.View
                  className="absolute inset-0 overflow-hidden border bg-ink rounded-[22px] border-ink"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: [
                      { perspective: 1000 },
                      { rotateY: backRotation },
                    ],
                  }}
                >
                  <View className="justify-between flex-1 p-6">
                    <View className="flex-row items-start justify-between">
                      <View>
                        <Text className="text-white font-archivo-black text-subjudul">
                          Dampak donasimu
                        </Text>

                        <Text className="mt-1 text-white/70 font-archivo text-caption">
                          Terima kasih sudah membantu sesama.
                        </Text>
                      </View>

                      <HeartPulse color="#EC3013" size={30} />
                    </View>

                    <View className="flex-row gap-2 mt-5">
                      <ImpactStat
                        value={String(totalDonations)}
                        label="Donasi"
                      />

                      <ImpactStat value={String(livesHelped)} label="Nyawa" />

                      <ImpactStat
                        value={formatLiter(totalVolumeMl)}
                        label="Liter"
                      />
                    </View>

                    <View className="flex-row items-center mt-5">
                      <RotateCcw color="#FFFFFF" size={15} />

                      <Text className="ml-2 text-white/70 font-archivo text-caption">
                        Ketuk untuk kembali
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              </Pressable>

              {/* Ringkasan */}
              <Text className="mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
                RINGKASAN
              </Text>

              <View className="flex-row gap-2 mt-3">
                <SummaryCard value={String(totalDonations)} label="Donasi" />

                <SummaryCard
                  value={String(livesHelped)}
                  label="Nyawa terbantu"
                />

                <SummaryCard value={formatLiter(totalVolumeMl)} label="Liter" />
              </View>

              {/* Daftar */}
              <Text className="mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
                DAFTAR DONASI
              </Text>

              <View className="gap-3 mt-3">
                {histories.length === 0 ? (
                  <View className="p-5 border rounded-card border-line bg-surface">
                    <Text className="font-archivo-semibold text-body text-ink">
                      Belum ada riwayat
                    </Text>

                    <Text className="mt-1 font-archivo text-caption text-ink-muted">
                      Donasi yang sudah selesai akan muncul di sini.
                    </Text>
                  </View>
                ) : (
                  histories.map((history) => (
                    <View
                      key={history.id}
                      className="p-5 border rounded-card border-line bg-surface"
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 mr-3">
                          <Text className="font-archivo-bold text-body text-ink">
                            {history.hospital?.hospital_name ??
                              "Fasilitas kesehatan"}
                          </Text>

                          <View className="flex-row items-center mt-1">
                            <CalendarDays color="#6F6A68" size={15} />

                            <Text className="ml-2 font-archivo text-caption text-ink-muted">
                              {formatDate(
                                history.checked_in_at ??
                                  history.blood?.schedule,
                              )}
                            </Text>
                          </View>
                        </View>

                        <View className="px-3 py-1 rounded-pill bg-primary-soft">
                          <Text className="font-archivo-bold text-overline tracking-overline text-primary-dark">
                            SELESAI
                          </Text>
                        </View>
                      </View>

                      <View className="pt-4 mt-4 border-t border-line">
                        <DetailRow
                          label="Golongan"
                          value={
                            history.blood
                              ? `${history.blood.blood_type}${history.blood.rhesus}`
                              : "-"
                          }
                        />

                        <DetailRow
                          label="Komponen"
                          value={formatComponent(history.blood?.component)}
                        />

                        <DetailRow
                          label="Volume"
                          value={formatVolume(history.volume_ml)}
                          last
                        />
                      </View>

                      {history.hospital?.address ? (
                        <Text className="pt-3 mt-3 border-t font-archivo text-caption text-ink-muted border-line">
                          {history.hospital.address}
                        </Text>
                      ) : null}
                    </View>
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ImpactStat({ value, label }: { value: string; label: string }) {
  return (
    <View className="items-center flex-1 px-2 py-3 rounded-card bg-white/10">
      <Text className="text-white font-archivo-black text-subjudul">
        {value}
      </Text>

      <Text className="mt-1 text-center text-white/70 font-archivo text-caption">
        {label}
      </Text>
    </View>
  );
}

function SummaryCard({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 p-3 border rounded-card border-line bg-surface">
      <Text className="font-archivo-black text-subjudul text-primary">
        {value}
      </Text>

      <Text
        className="mt-1 font-archivo text-caption text-ink-muted"
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}

function DetailRow({
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
      className={`flex-row items-center justify-between ${last ? "" : "mb-3"}`}
    >
      <Text className="font-archivo text-caption text-ink-muted">{label}</Text>

      <Text className="font-archivo-semibold text-caption text-ink">
        {value}
      </Text>
    </View>
  );
}
