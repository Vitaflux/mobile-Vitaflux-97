import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../src/store/auth";
import { listBloods } from "../../src/api/bloods";
import { getMyHospital } from "../../src/api/hospitals";

type FacilityBlood = {
  id: string;
  blood_type: string;
  rhesus: string;
  quantity: number;
  status_blood: "normal" | "urgent" | "closed";
  schedule: string;
  schedule_end?: string | null;
  title?: string | null;
  component?: string | null;
  applicants_count?: number;
  collected?: number;
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

const COMPONENT_LABELS: Record<string, string> = {
  whole_blood: "Whole blood",
  plasma: "Plasma",
  trombosit: "Trombosit",
  eritrosit: "Eritrosit",
};

function formatSchedule(startValue: string, endValue?: string | null) {
  const start = new Date(startValue);

  if (Number.isNaN(start.getTime())) {
    return "-";
  }

  const startTime = `${String(start.getHours()).padStart(2, "0")}.${String(
    start.getMinutes(),
  ).padStart(2, "0")}`;

  const date = `${HARI[start.getDay()]}, ${start.getDate()} ${
    BULAN[start.getMonth()]
  }`;

  if (!endValue) {
    return `${date} · ${startTime}`;
  }

  const end = new Date(endValue);

  if (Number.isNaN(end.getTime())) {
    return `${date} · ${startTime}`;
  }

  const endTime = `${String(end.getHours()).padStart(2, "0")}.${String(
    end.getMinutes(),
  ).padStart(2, "0")}`;

  return `${date} · ${startTime}–${endTime}`;
}

export default function FacilityDashboard() {
  const user = useAuth((state) => state.user);
  const logout = useAuth((state) => state.logout);

  const bloodQuery = useQuery({
    queryKey: ["facility-bloods"],
    queryFn: () => listBloods(),
  });

  const hospitalQuery = useQuery({
    queryKey: ["my-hospital"],
    queryFn: () => getMyHospital(),
  });

  const bloods = (bloodQuery.data ?? []) as FacilityBlood[];

  const activeBloods = bloods.filter(
    (blood) => blood.status_blood !== "closed",
  );

  const totalCollected = bloods.reduce(
    (total, blood) => total + (blood.collected ?? 0),
    0,
  );

  const doneCount = hospitalQuery.data?.stats.total_collected ?? 0;

  const confirmedCount = Math.max(0, totalCollected - doneCount);

  const refreshing = bloodQuery.isFetching || hospitalQuery.isFetching;

  async function onRefresh() {
    await Promise.all([bloodQuery.refetch(), hospitalQuery.refetch()]);
  }

  async function onLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  function onManage(bloodId: string) {
    router.push({
      pathname: "/(facility)/applicants",
      params: {
        bloodId,
      },
    });
  }

  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerClassName="px-6 pb-10"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mt-2">
            <View className="flex-row items-center flex-1">
              <View className="items-center justify-center w-12 h-12 mr-3 rounded-card bg-primary">
                <Text className="text-white font-archivo-black text-body">
                  RS
                </Text>
              </View>

              <View className="flex-1">
                <Text
                  className="font-archivo-bold text-subjudul text-ink"
                  numberOfLines={1}
                >
                  {hospitalQuery.data?.hospital_name ??
                    user?.name ??
                    "Fasilitas kesehatan"}
                </Text>

                <View className="flex-row items-center mt-1">
                  <View className="self-start px-2 py-0.5 rounded-pill bg-primary-soft">
                    <Text className="font-archivo-bold text-overline tracking-overline text-primary-dark">
                      {hospitalQuery.data?.isVerified === false
                        ? "BELUM TERVERIFIKASI"
                        : "TERVERIFIKASI"}
                    </Text>
                  </View>

                  {hospitalQuery.data?.code ? (
                    <Text className="ml-2 font-archivo-semibold text-caption text-ink-muted">
                      {hospitalQuery.data.code}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>

            <Pressable onPress={onLogout} hitSlop={8} className="ml-2">
              <Text className="font-archivo-semibold text-caption text-ink-muted">
                Keluar
              </Text>
            </Pressable>
          </View>

          {bloodQuery.isLoading ? (
            <View className="items-center py-16 mt-6">
              <ActivityIndicator color="#EC3013" />

              <Text className="mt-3 font-archivo text-caption text-ink-muted">
                Memuat dashboard...
              </Text>
            </View>
          ) : bloodQuery.isError ? (
            <View className="mt-6 rounded-[18px] border border-line bg-surface p-5">
              <Text className="font-archivo-bold text-body text-ink">
                Dashboard belum dapat dimuat
              </Text>

              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                Periksa koneksi lalu coba lagi.
              </Text>

              <Pressable
                onPress={() => bloodQuery.refetch()}
                className="items-center py-3 mt-4 rounded-pill bg-primary"
              >
                <Text className="text-white font-archivo-bold text-body">
                  Coba lagi
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Ringkasan */}
              <View className="flex-row gap-3 mt-6">
                <Stat value={activeBloods.length} label="Aktif" />

                <Stat value={confirmedCount} label="Dikonfirmasi" accent />

                <Stat value={doneCount} label="Selesai" />
              </View>

              {/* Actions */}
              <Pressable
                onPress={() => router.push("/(facility)/create")}
                className="items-center py-4 mt-5 rounded-pill bg-primary active:bg-primary-dark"
              >
                <Text className="text-white font-archivo-bold text-body">
                  + Buat kebutuhan darah
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/(facility)/scan")}
                className="items-center py-4 mt-3 border rounded-pill border-line bg-surface active:bg-ground"
              >
                <Text className="font-archivo-semibold text-body text-ink">
                  Scan QR check-in
                </Text>
              </Pressable>

              {/* Active requests */}
              <Text className="mb-3 mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
                KEBUTUHAN AKTIF
              </Text>

              {activeBloods.length === 0 ? (
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
                  {activeBloods.map((blood) => (
                    <BloodCard
                      key={blood.id}
                      blood={blood}
                      onPress={() => onManage(blood.id)}
                    />
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

function BloodCard({
  blood,
  onPress,
}: {
  blood: FacilityBlood;
  onPress: () => void;
}) {
  const applicants = blood.applicants_count ?? 0;
  const collected = blood.collected ?? 0;

  const percentage =
    blood.quantity <= 0
      ? 0
      : Math.min(100, Math.round((collected / blood.quantity) * 100));

  const component = blood.component
    ? (COMPONENT_LABELS[blood.component] ?? blood.component)
    : null;

  return (
    <Pressable
      onPress={onPress}
      className="rounded-[18px] border border-line bg-surface p-4 active:bg-ground"
    >
      <View className="flex-row items-center justify-between">
        <View
          className={`rounded-pill px-3 py-1 ${
            blood.status_blood === "urgent" ? "bg-primary" : "bg-ground"
          }`}
        >
          <Text
            className={`font-archivo-bold text-overline tracking-overline ${
              blood.status_blood === "urgent" ? "text-white" : "text-ink-muted"
            }`}
          >
            {blood.status_blood === "urgent" ? "MENDESAK" : "RUTIN"}
          </Text>
        </View>

        <View className="px-3 py-1 rounded-pill bg-primary-soft">
          <Text className="font-archivo-bold text-caption text-primary-dark">
            {blood.blood_type}
            {blood.rhesus}
          </Text>
        </View>
      </View>

      <Text className="mt-3 font-archivo-bold text-body text-ink">
        {blood.title || "Kebutuhan darah"}
      </Text>

      {component ? (
        <Text className="mt-1 font-archivo text-caption text-ink-muted">
          {component}
        </Text>
      ) : null}

      <Text className="mt-2 font-archivo text-caption text-ink-muted">
        {formatSchedule(blood.schedule, blood.schedule_end)}
      </Text>

      <Text className="mt-3 font-archivo-semibold text-caption text-ink">
        {applicants} pendaftar · {collected} dari {blood.quantity} kantong
      </Text>

      <View className="h-2 mt-2 overflow-hidden rounded-pill bg-ground">
        <View
          className="h-full rounded-pill bg-primary"
          style={{
            width: `${percentage}%`,
          }}
        />
      </View>

      <View className="flex-row items-center justify-between mt-3">
        <Text className="font-archivo text-caption text-ink-muted">
          {percentage}% terkumpul
        </Text>

        <Text className="font-archivo-bold text-caption text-primary-dark">
          Kelola →
        </Text>
      </View>
    </Pressable>
  );
}

function Stat({
  value,
  label,
  accent = false,
}: {
  value: number;
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
        {value}
      </Text>

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        className="mt-1 font-archivo text-caption text-ink-muted"
      >
        {label}
      </Text>
    </View>
  );
}
