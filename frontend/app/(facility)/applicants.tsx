import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { applicantsForBlood, confirmRequest } from "../../src/api/requests";
import { errorMessage } from "../../src/lib/errorMessage";

type Applicant = {
  id: string;
  donor: { name: string | null; blood_type: string; rhesus: string } | null;
  status: "registered" | "confirmed" | "done";
  qr_token: string;
};

const FILTERS = [
  { key: "all", label: "Semua" },
  { key: "registered", label: "Terdaftar" },
  { key: "confirmed", label: "Dikonfirmasi" },
  { key: "done", label: "Selesai" },
];

function StatusBadge({ status }: { status: Applicant["status"] }) {
  const map = {
    registered: { t: "Terdaftar", c: "bg-ground", f: "text-ink-muted" },
    confirmed: { t: "Dikonfirmasi", c: "bg-ink", f: "text-white" },
    done: { t: "Selesai", c: "border border-line", f: "text-ink" },
  }[status];
  return (
    <View className={`rounded-pill px-3 py-1 ${map.c}`}>
      <Text className={`font-archivo-bold text-overline tracking-overline ${map.f}`}>
        {map.t}
      </Text>
    </View>
  );
}

export default function Applicants() {
  const params = useLocalSearchParams<{ bloodId?: string }>();
  const bloodId = params.bloodId ?? "";
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [confirming, setConfirming] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["applicants", bloodId],
    queryFn: () => applicantsForBlood(bloodId),
    enabled: !!bloodId,
  });

  const all = (q.data ?? []) as unknown as Applicant[];
  const list = filter === "all" ? all : all.filter((a) => a.status === filter);

  async function onConfirm(id: string) {
    setConfirming(id);
    try {
      await confirmRequest(id);
      await qc.invalidateQueries({ queryKey: ["applicants", bloodId] });
    } catch (e: any) {
      Alert.alert("Gagal konfirmasi", errorMessage(e, "Coba lagi."));
    } finally {
      setConfirming(null);
    }
  }

  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        <View className="px-6">
          <View className="h-12 flex-row items-center">
            <Pressable onPress={() => router.back()} hitSlop={8} className="mr-3">
              <Text className="text-2xl text-ink">←</Text>
            </Pressable>
            <Text className="font-archivo-semibold text-body text-ink">
              Pendaftar
            </Text>
          </View>

          {/* Filter */}
          <View className="mt-2 flex-row gap-2">
            {FILTERS.map((fl) => {
              const active = fl.key === filter;
              return (
                <Pressable
                  key={fl.key}
                  onPress={() => setFilter(fl.key)}
                  className={`rounded-pill border px-3 py-2 ${
                    active
                      ? "border-primary bg-primary"
                      : "border-line bg-surface"
                  }`}
                >
                  <Text
                    className={`font-archivo-semibold text-caption ${
                      active ? "text-white" : "text-ink"
                    }`}
                  >
                    {fl.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <ScrollView
          contentContainerClassName="px-6 pt-4 pb-10"
          refreshControl={
            <RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />
          }
        >
          {q.isLoading ? (
            <View className="items-center py-10">
              <ActivityIndicator color="#EC3013" />
            </View>
          ) : list.length === 0 ? (
            <View className="rounded-[18px] border border-line bg-surface p-5">
              <Text className="font-archivo-bold text-body text-ink">
                Belum ada pendaftar
              </Text>
              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                {filter === "all"
                  ? "Belum ada yang mendaftar ke kebutuhan ini."
                  : "Tidak ada pendaftar pada status ini."}
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {list.map((a) => (
                <View
                  key={a.id}
                  className="rounded-[18px] border border-line bg-surface p-4"
                >
                  <View className="flex-row items-center">
                    <View className="mr-3 h-11 w-11 items-center justify-center rounded-card bg-primary-soft">
                      <Text className="font-archivo-black text-body text-primary-dark">
                        {(a.donor?.name?.[0] ?? "?").toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-archivo-bold text-body text-ink">
                        {a.donor?.name ?? "Pendonor"}
                      </Text>
                      <Text className="mt-0.5 font-archivo text-caption text-ink-muted">
                        {a.donor ? `${a.donor.blood_type}${a.donor.rhesus}` : "-"}
                      </Text>
                    </View>
                    <StatusBadge status={a.status} />
                  </View>

                  {a.status === "registered" && (
                    <Pressable
                      onPress={() => onConfirm(a.id)}
                      disabled={confirming === a.id}
                      className="mt-4 items-center rounded-pill bg-primary py-3 active:bg-primary-dark"
                    >
                      {confirming === a.id ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text className="font-archivo-bold text-body text-white">
                          Konfirmasi
                        </Text>
                      )}
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
