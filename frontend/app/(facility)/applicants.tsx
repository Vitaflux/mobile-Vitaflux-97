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
import { QrCode } from "lucide-react-native";
import { applicantsForBlood, confirmRequest } from "../../src/api/requests";
import { getBlood } from "../../src/api/bloods";
import { errorMessage } from "../../src/lib/errorMessage";

type ApplicantStatus = "registered" | "confirmed" | "done";

type Applicant = {
  id: string;
  donor: {
    name: string | null;
    blood_type: string;
    rhesus: string;
  } | null;
  status: ApplicantStatus;
  qr_token?: string;
};

type BloodContext = {
  id: string;
  title?: string | null;
  blood_type: string;
  rhesus: string;
  quantity: number;
};

const FILTERS: {
  key: "all" | ApplicantStatus;
  label: string;
}[] = [
  {
    key: "all",
    label: "Semua",
  },
  {
    key: "registered",
    label: "Terdaftar",
  },
  {
    key: "confirmed",
    label: "Dikonfirmasi",
  },
  {
    key: "done",
    label: "Selesai",
  },
];

export default function Applicants() {
  const params = useLocalSearchParams<{
    bloodId?: string;
  }>();

  const bloodId = params.bloodId ?? "";
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const [confirming, setConfirming] = useState<string | null>(null);

  const applicantQuery = useQuery({
    queryKey: ["applicants", bloodId],
    queryFn: () => applicantsForBlood(bloodId),
    enabled: Boolean(bloodId),
  });

  const bloodQuery = useQuery({
    queryKey: ["facility-blood", bloodId],
    queryFn: () => getBlood(bloodId),
    enabled: Boolean(bloodId),
  });

  const blood = bloodQuery.data as BloodContext | undefined;
  const applicants = (applicantQuery.data ?? []) as unknown as Applicant[];

  const filteredApplicants =
    filter === "all"
      ? applicants
      : applicants.filter((applicant) => applicant.status === filter);

  const registeredCount = applicants.filter(
    (applicant) => applicant.status === "registered",
  ).length;

  const confirmedCount = applicants.filter(
    (applicant) => applicant.status === "confirmed",
  ).length;

  const doneCount = applicants.filter(
    (applicant) => applicant.status === "done",
  ).length;

  const refreshing = applicantQuery.isFetching || bloodQuery.isFetching;

  async function onRefresh() {
    await Promise.all([applicantQuery.refetch(), bloodQuery.refetch()]);
  }

  async function onConfirm(id: string) {
    setConfirming(id);

    try {
      await confirmRequest(id);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["applicants", bloodId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["facility-bloods"],
        }),
      ]);
    } catch (error: any) {
      Alert.alert("Gagal konfirmasi", errorMessage(error, "Coba lagi."));
    } finally {
      setConfirming(null);
    }
  }

  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6">
          <View className="flex-row items-center h-12">
            {bloodId ? (
              <Pressable
                onPress={() => router.back()}
                hitSlop={8}
                className="mr-3"
              >
                <Text className="text-2xl text-ink">←</Text>
              </Pressable>
            ) : null}

            <View className="flex-1">
              <Text
                className="font-archivo-bold text-subjudul text-ink"
                numberOfLines={1}
              >
                {blood?.title || "Pendaftar"}
              </Text>

              {blood ? (
                <Text className="mt-0.5 font-archivo text-caption text-ink-muted">
                  {blood.blood_type}
                  {blood.rhesus} · {blood.quantity} kantong
                </Text>
              ) : null}
            </View>
          </View>

          {bloodId && applicants.length > 0 ? (
            <View className="flex-row gap-2 mt-3">
              <Summary value={registeredCount} label="Terdaftar" />

              <Summary value={confirmedCount} label="Konfirmasi" accent />

              <Summary value={doneCount} label="Selesai" />
            </View>
          ) : null}

          {bloodId ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 mt-4"
            >
              {FILTERS.map((item) => {
                const active = item.key === filter;

                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setFilter(item.key)}
                    className={`rounded-pill border px-4 py-2 ${
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
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </View>

        <ScrollView
          contentContainerClassName="px-6 pt-4 pb-10"
          refreshControl={
            bloodId ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
        >
          {!bloodId ? (
            <View className="rounded-[18px] border border-line bg-surface p-5">
              <Text className="font-archivo-bold text-body text-ink">
                Pilih kebutuhan terlebih dahulu
              </Text>

              <Text className="mt-1 leading-5 font-archivo text-caption text-ink-muted">
                Pilih kebutuhan aktif dari Dashboard untuk melihat daftar
                pendonor.
              </Text>

              <Pressable
                onPress={() => router.push("/(facility)")}
                className="items-center py-3 mt-5 rounded-pill bg-primary"
              >
                <Text className="text-white font-archivo-bold text-body">
                  Ke Dashboard
                </Text>
              </Pressable>
            </View>
          ) : applicantQuery.isLoading || bloodQuery.isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator color="#EC3013" />

              <Text className="mt-3 font-archivo text-caption text-ink-muted">
                Memuat pendaftar...
              </Text>
            </View>
          ) : applicantQuery.isError || bloodQuery.isError ? (
            <View className="rounded-[18px] border border-line bg-surface p-5">
              <Text className="font-archivo-bold text-body text-ink">
                Pendaftar belum dapat dimuat
              </Text>

              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                Periksa koneksi lalu coba lagi.
              </Text>

              <Pressable
                onPress={onRefresh}
                className="items-center py-3 mt-4 rounded-pill bg-primary"
              >
                <Text className="text-white font-archivo-bold text-body">
                  Coba lagi
                </Text>
              </Pressable>
            </View>
          ) : filteredApplicants.length === 0 ? (
            <View className="rounded-[18px] border border-line bg-surface p-5">
              <Text className="font-archivo-bold text-body text-ink">
                Belum ada pendaftar
              </Text>

              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                {filter === "all"
                  ? "Belum ada pendonor yang mendaftar."
                  : "Tidak ada pendaftar pada status ini."}
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {filteredApplicants.map((applicant) => (
                <ApplicantCard
                  key={applicant.id}
                  applicant={applicant}
                  confirming={confirming === applicant.id}
                  onConfirm={() => onConfirm(applicant.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ApplicantCard({
  applicant,
  confirming,
  onConfirm,
}: {
  applicant: Applicant;
  confirming: boolean;
  onConfirm: () => void;
}) {
  return (
    <View className="rounded-[18px] border border-line bg-surface p-4">
      <View className="flex-row items-center">
        <View className="items-center justify-center mr-3 h-11 w-11 rounded-card bg-primary-soft">
          <Text className="font-archivo-black text-body text-primary-dark">
            {(applicant.donor?.name?.[0] ?? "?").toUpperCase()}
          </Text>
        </View>

        <View className="flex-1">
          <Text className="font-archivo-bold text-body text-ink">
            {applicant.donor?.name ?? "Pendonor"}
          </Text>

          <Text className="mt-0.5 font-archivo text-caption text-ink-muted">
            {applicant.donor
              ? `${applicant.donor.blood_type}${applicant.donor.rhesus}`
              : "-"}
          </Text>
        </View>

        <View className="items-end">
          <QrCode
            color={applicant.status === "confirmed" ? "#EC3013" : "#605D5D"}
            size={22}
          />

          <View className="mt-2">
            <StatusBadge status={applicant.status} />
          </View>
        </View>
      </View>

      {applicant.status === "registered" ? (
        <Pressable
          onPress={onConfirm}
          disabled={confirming}
          className="items-center py-3 mt-4 rounded-pill bg-primary active:bg-primary-dark"
        >
          {confirming ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-archivo-bold text-body">
              Konfirmasi
            </Text>
          )}
        </Pressable>
      ) : null}

      {applicant.status === "confirmed" ? (
        <Pressable
          onPress={() => router.push("/(facility)/scan")}
          className="flex-row items-center justify-center py-3 mt-4 border rounded-pill border-primary active:bg-primary-soft"
        >
          <QrCode color="#A31B0A" size={18} />

          <Text className="ml-2 font-archivo-bold text-body text-primary-dark">
            Scan QR untuk selesaikan
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function StatusBadge({ status }: { status: ApplicantStatus }) {
  const styles = {
    registered: {
      label: "Terdaftar",
      container: "bg-ground",
      text: "text-ink-muted",
    },
    confirmed: {
      label: "Dikonfirmasi",
      container: "bg-primary-soft",
      text: "text-primary-dark",
    },
    done: {
      label: "Selesai",
      container: "bg-ink",
      text: "text-white",
    },
  }[status];

  return (
    <View className={`rounded-pill px-3 py-1 ${styles.container}`}>
      <Text
        className={`font-archivo-bold text-overline tracking-overline ${styles.text}`}
      >
        {styles.label}
      </Text>
    </View>
  );
}

function Summary({
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
      className={`flex-1 rounded-card border p-3 ${
        accent ? "border-primary bg-primary-soft" : "border-line bg-surface"
      }`}
    >
      <Text
        className={`font-archivo-black text-subjudul ${
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
