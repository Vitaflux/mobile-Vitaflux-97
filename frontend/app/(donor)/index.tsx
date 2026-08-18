import { useState } from "react";
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
import { MapPin } from "lucide-react-native";
import { useAuth } from "../../src/store/auth";
import { getMyProfile } from "../../src/api/profiles";
import { matchBloods } from "../../src/api/bloods";
import { haversineKm } from "../../src/lib/haversine";

type Match = {
  id: string;
  blood_type: string;
  rhesus: string;
  quantity: number;
  status_blood: "normal" | "urgent" | "closed";
  schedule: string;
  schedule_end?: string | null;
  title?: string | null;
  note?: string | null;
  component?: string | null;
  applicants_count?: number;
  collected?: number;
  hospital: {
    id: string;
    hospital_name: string;
    address?: string | null;
    location: {
      type: "Point";
      coordinates: [number, number];
    };
  } | null;
};

type MatchFilter = "all" | "urgent" | "weekend";

const RADII = [
  {
    label: "5 km",
    meters: 5000,
  },
  {
    label: "10 km",
    meters: 10000,
  },
  {
    label: "20 km",
    meters: 20000,
  },
];

const FILTERS: {
  key: MatchFilter;
  label: string;
}[] = [
  {
    key: "all",
    label: "Semua",
  },
  {
    key: "urgent",
    label: "Mendesak",
  },
  {
    key: "weekend",
    label: "Akhir pekan",
  },
];

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

  const dateText = `${HARI[start.getDay()]}, ${start.getDate()} ${
    BULAN[start.getMonth()]
  }`;

  if (!endValue) {
    return `${dateText} · ${startTime}`;
  }

  const end = new Date(endValue);

  if (Number.isNaN(end.getTime())) {
    return `${dateText} · ${startTime}`;
  }

  const endTime = `${String(end.getHours()).padStart(2, "0")}.${String(
    end.getMinutes(),
  ).padStart(2, "0")}`;

  return `${dateText} · ${startTime}–${endTime}`;
}

function formatLastDonor(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`;
}

function daysSince(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const today = new Date();

  const donorDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const currentDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  return Math.max(
    0,
    Math.floor((currentDate.getTime() - donorDate.getTime()) / 86400000),
  );
}

function isWeekend(schedule: string) {
  const date = new Date(schedule);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.getDay() === 0 || date.getDay() === 6;
}

export default function DonorHome() {
  const user = useAuth((state) => state.user);

  const [radiusMeters, setRadiusMeters] = useState(10000);

  const [filter, setFilter] = useState<MatchFilter>("all");

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => getMyProfile(),
    retry: false,
  });

  const matchesQuery = useQuery({
    queryKey: ["matches", radiusMeters],
    queryFn: () => matchBloods(radiusMeters),
    enabled: Boolean(profileQuery.data),
  });

  const profile = profileQuery.data;

  const matches = (matchesQuery.data ?? []) as Match[];

  const filteredMatches = matches.filter((blood) => {
    if (filter === "urgent") {
      return blood.status_blood === "urgent";
    }

    if (filter === "weekend") {
      return isWeekend(blood.schedule);
    }

    return true;
  });

  const donorCoordinates = profile?.location?.coordinates as
    | [number, number]
    | undefined;

  const lastDonorText = formatLastDonor(profile?.last_donor);

  const daysAfterDonor = daysSince(profile?.last_donor);

  const noProfile = profileQuery.isError;

  function distanceKm(
    location?: {
      coordinates: [number, number];
    } | null,
  ) {
    if (!donorCoordinates || !location) {
      return null;
    }

    return haversineKm(
      {
        latitude: donorCoordinates[1],
        longitude: donorCoordinates[0],
      },
      {
        latitude: location.coordinates[1],
        longitude: location.coordinates[0],
      },
    );
  }

  async function onRefresh() {
    await Promise.all([profileQuery.refetch(), matchesQuery.refetch()]);
  }

  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerClassName="px-6 pb-10"
          refreshControl={
            <RefreshControl
              refreshing={profileQuery.isFetching || matchesQuery.isFetching}
              onRefresh={onRefresh}
            />
          }
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mt-2 h-14">
            <View>
              <Text className="font-archivo text-caption text-ink-muted">
                Halo,
              </Text>

              <Text className="font-archivo-bold text-subjudul text-ink">
                {user?.name ?? "Pendonor"}
              </Text>
            </View>

            <Pressable
              onPress={() => router.push("/(donor)/profile")}
              className="items-center justify-center w-11 h-11 rounded-card bg-primary"
            >
              <Text className="text-white font-archivo-black text-body">
                {(user?.name?.[0] ?? "V").toUpperCase()}
              </Text>
            </Pressable>
          </View>

          {profileQuery.isLoading ? (
            <View className="items-center py-10 mt-6">
              <ActivityIndicator color="#EC3013" />
            </View>
          ) : noProfile ? (
            <View className="mt-6 rounded-[18px] border border-line bg-surface p-5">
              <Text className="font-archivo-bold text-body text-ink">
                Lengkapi profil dulu
              </Text>

              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                Isi golongan darah dan lokasi supaya kebutuhan dapat dicocokkan
                untukmu.
              </Text>

              <Pressable
                onPress={() => router.push("/(donor)/profile")}
                className="items-center py-3 mt-4 rounded-pill bg-primary"
              >
                <Text className="text-white font-archivo-bold text-body">
                  Isi profil
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Kelayakan */}
              <View
                className={`mt-6 rounded-[18px] border p-5 ${
                  profile?.eligibility.is_eligible
                    ? "border-primary bg-primary-soft"
                    : "border-line bg-surface"
                }`}
              >
                <Text
                  className={`font-archivo-black text-subjudul ${
                    profile?.eligibility.is_eligible
                      ? "text-primary-dark"
                      : "text-ink"
                  }`}
                >
                  {profile?.eligibility.is_eligible
                    ? "Kamu boleh donor sekarang"
                    : `Boleh donor lagi dalam ${profile?.eligibility.remaining_days} hari`}
                </Text>

                <Text className="mt-1 font-archivo text-caption text-ink-muted">
                  Golongan {profile?.blood_type}
                  {profile?.rhesus} · radius {radiusMeters / 1000} km
                </Text>

                {lastDonorText && daysAfterDonor !== null ? (
                  <Text className="mt-2 font-archivo-semibold text-caption text-ink">
                    Donor terakhir {lastDonorText} · {daysAfterDonor} hari lalu
                  </Text>
                ) : (
                  <Text className="mt-2 font-archivo text-caption text-ink-muted">
                    Belum ada tanggal donor terakhir.
                  </Text>
                )}
              </View>

              {/* Heading */}
              <View className="flex-row items-baseline justify-between mt-7">
                <Text className="font-archivo-bold text-judul text-ink">
                  Cocok untukmu
                </Text>

                <Text className="font-archivo text-caption text-ink-muted">
                  {filteredMatches.length} kebutuhan
                </Text>
              </View>

              {/* Radius */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2 mt-3"
              >
                {RADII.map((radius) => {
                  const active = radius.meters === radiusMeters;

                  return (
                    <Pressable
                      key={radius.meters}
                      onPress={() => setRadiusMeters(radius.meters)}
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
                        {radius.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Filters */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2 mt-3"
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

              {/* List */}
              {matchesQuery.isLoading ? (
                <View className="items-center py-10 mt-6">
                  <ActivityIndicator color="#EC3013" />
                </View>
              ) : filteredMatches.length === 0 ? (
                <View className="mt-6 rounded-[18px] border border-line bg-surface p-5">
                  <Text className="font-archivo-bold text-body text-ink">
                    Belum ada kebutuhan cocok
                  </Text>

                  <Text className="mt-1 font-archivo text-caption text-ink-muted">
                    {profile?.eligibility.is_eligible
                      ? "Tidak ada kebutuhan yang cocok dengan filter dan radius ini."
                      : "Kamu belum boleh donor sekarang, jadi kebutuhan belum ditampilkan."}
                  </Text>
                </View>
              ) : (
                <View className="gap-3 mt-4">
                  {filteredMatches.map((blood) => {
                    const distance = distanceKm(blood.hospital?.location);

                    return (
                      <MatchCard
                        key={blood.id}
                        blood={blood}
                        distance={distance}
                        onPress={() =>
                          router.push({
                            pathname: "/(donor)/detail",
                            params: {
                              data: JSON.stringify({
                                ...blood,
                                distanceKm: distance,
                              }),
                            },
                          })
                        }
                      />
                    );
                  })}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function MatchCard({
  blood,
  distance,
  onPress,
}: {
  blood: Match;
  distance: number | null;
  onPress: () => void;
}) {
  const urgent = blood.status_blood === "urgent";

  const hasProgress =
    typeof blood.applicants_count === "number" &&
    typeof blood.collected === "number";

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
            urgent ? "bg-primary" : "bg-ground"
          }`}
        >
          <Text
            className={`font-archivo-bold text-overline tracking-overline ${
              urgent ? "text-white" : "text-ink-muted"
            }`}
          >
            {urgent ? "MENDESAK" : "TERJADWAL"}
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

      <Text className="mt-1 font-archivo-semibold text-caption text-ink">
        {blood.hospital?.hospital_name ?? "Fasilitas kesehatan"}
      </Text>

      {blood.hospital?.address ? (
        <View className="flex-row items-start mt-2">
          <MapPin color="#605D5D" size={16} />

          <Text
            className="flex-1 ml-2 font-archivo text-caption text-ink-muted"
            numberOfLines={2}
          >
            {blood.hospital.address}
          </Text>
        </View>
      ) : null}

      <Text className="mt-2 font-archivo text-caption text-ink-muted">
        {distance !== null ? `${distance.toFixed(1)} km · ` : ""}
        {formatSchedule(blood.schedule, blood.schedule_end)}
      </Text>

      {component ? (
        <Text className="mt-2 font-archivo text-caption text-ink-muted">
          {component}
        </Text>
      ) : null}

      {hasProgress ? (
        <>
          <Text className="mt-3 font-archivo-semibold text-caption text-ink">
            {blood.applicants_count} pendaftar
            {" · "}
            {collected} dari {blood.quantity} kantong
          </Text>

          <View className="h-2 mt-2 overflow-hidden rounded-pill bg-ground">
            <View
              className="h-full rounded-pill bg-primary"
              style={{
                width: `${percentage}%`,
              }}
            />
          </View>
        </>
      ) : (
        <Text className="mt-3 font-archivo-semibold text-caption text-ink">
          {blood.quantity} kantong dibutuhkan
        </Text>
      )}
    </Pressable>
  );
}
