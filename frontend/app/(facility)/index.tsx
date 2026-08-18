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
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../src/store/auth";
import { listBloods } from "../../src/api/bloods";

type Blood = {
  id: string;
  blood_type: string;
  rhesus: string;
  quantity: number;
  status_blood: "normal" | "urgent" | "closed";
  schedule: string;
};

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function formatSchedule(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const jam = `${String(d.getHours()).padStart(2, "0")}.${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} · ${jam}`;
}

export default function FacilityDashboard() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const q = useQuery({
    queryKey: ["facility-bloods"],
    queryFn: listBloods,
  });

  const bloods = ((q.data ?? []) as unknown as Blood[]);
  const aktif = bloods.filter((b) => b.status_blood !== "closed");
  const mendesak = bloods.filter((b) => b.status_blood === "urgent").length;
  const selesai = bloods.filter((b) => b.status_blood === "closed").length;

  async function onLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  const onCreate = () => router.push("/(facility)/create");
  const onManage = (bloodId: string) =>
    router.push({ pathname: "/(facility)/applicants", params: { bloodId } });

  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerClassName="px-6 pb-10"
          refreshControl={
            <RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />
          }
        >
          {/* Header */}
          <View className="mt-2 flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center">
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-card bg-primary">
                <Text className="font-archivo-black text-body text-white">RS</Text>
              </View>
              <View className="flex-1">
                <Text
                  className="font-archivo-bold text-subjudul text-ink"
                  numberOfLines={1}
                >
                  {user?.name ?? "Fasilitas Kesehatan"}
                </Text>
                <View className="mt-1 self-start rounded-pill bg-primary-soft px-2 py-0.5">
                  <Text className="font-archivo-bold text-overline tracking-overline text-primary-dark">
                    TERVERIFIKASI
                  </Text>
                </View>
              </View>
            </View>
            <Pressable onPress={onLogout} hitSlop={8} className="ml-2">
              <Text className="font-archivo-semibold text-caption text-ink-muted">
                Keluar
              </Text>
            </Pressable>
          </View>

          {/* Ringkasan */}
          {q.isLoading ? (
            <View className="mt-6 items-center py-10">
              <ActivityIndicator color="#EC3013" />
            </View>
          ) : q.isError ? (
            <View className="mt-6 rounded-[18px] border border-line bg-surface p-5">
              <Text className="font-archivo-bold text-body text-ink">
                Profil faskes belum ada
              </Text>
              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                Akun ini belum tertaut ke data rumah sakit, jadi kebutuhan belum bisa
                ditampilkan. (Perlu seed hospital di backend.)
              </Text>
            </View>
          ) : (
            <>
              <View className="mt-6 flex-row gap-3">
                <Stat n={aktif.length} label="Aktif" />
                <Stat n={mendesak} label="Mendesak" accent />
                <Stat n={selesai} label="Selesai" />
              </View>

              <Pressable
                onPress={onCreate}
                className="mt-5 items-center rounded-pill bg-primary py-4 active:bg-primary-dark"
              >
                <Text className="font-archivo-bold text-body text-white">
                  + Buat kebutuhan darah
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/(facility)/scan")}
                className="mt-3 items-center rounded-pill border border-line py-4 active:bg-surface"
              >
                <Text className="font-archivo-semibold text-body text-ink">
                  Scan QR check-in
                </Text>
              </Pressable>

              <Text className="mb-3 mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
                KEBUTUHAN AKTIF
              </Text>

              {aktif.length === 0 ? (
                <View className="rounded-[18px] border border-line bg-surface p-5">
                  <Text className="font-archivo-bold text-body text-ink">
                    Belum ada kebutuhan aktif
                  </Text>
                  <Text className="mt-1 font-archivo text-caption text-ink-muted">
                    Buat kebutuhan pertamamu lewat tombol di atas.
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {aktif.map((b) => (
                    <Pressable
                      key={b.id}
                      onPress={() => onManage(b.id)}
                      className="rounded-[18px] border border-line bg-surface p-4 active:bg-ground"
                    >
                      <View className="flex-row items-center justify-between">
                        <View
                          className={`rounded-pill px-3 py-1 ${
                            b.status_blood === "urgent"
                              ? "bg-primary"
                              : "bg-ground"
                          }`}
                        >
                          <Text
                            className={`font-archivo-bold text-overline tracking-overline ${
                              b.status_blood === "urgent"
                                ? "text-white"
                                : "text-ink-muted"
                            }`}
                          >
                            {b.status_blood === "urgent" ? "MENDESAK" : "RUTIN"}
                          </Text>
                        </View>
                        <View className="rounded-pill bg-primary-soft px-3 py-1">
                          <Text className="font-archivo-bold text-caption text-primary-dark">
                            {b.blood_type}
                            {b.rhesus}
                          </Text>
                        </View>
                      </View>

                      <Text className="mt-3 font-archivo text-caption text-ink-muted">
                        {formatSchedule(b.schedule)}
                      </Text>
                      <View className="mt-1 flex-row items-center justify-between">
                        <Text className="font-archivo-semibold text-body text-ink">
                          {b.quantity} kantong dibutuhkan
                        </Text>
                        <Text className="font-archivo-bold text-caption text-primary-dark">
                          Kelola →
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Stat({
  n,
  label,
  accent,
}: {
  n: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <View
      className={`flex-1 rounded-[18px] border p-4 ${
        accent ? "border-primary bg-primary-soft" : "border-line bg-surface"
      }`}
    >
      <Text
        className={`font-archivo-black text-judul ${
          accent ? "text-primary-dark" : "text-ink"
        }`}
      >
        {n}
      </Text>
      <Text className="mt-1 font-archivo text-caption text-ink-muted">{label}</Text>
    </View>
  );
}
