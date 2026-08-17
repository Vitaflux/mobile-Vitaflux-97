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
  hospital: {
    id: string;
    hospital_name: string;
    location: { type: "Point"; coordinates: [number, number] };
  } | null;
};

const RADII = [
  { label: "5 km", m: 5000 },
  { label: "10 km", m: 10000 },
  { label: "20 km", m: 20000 },
];

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

export default function DonorHome() {
  const user = useAuth((s) => s.user);
  const [radiusM, setRadiusM] = useState(10000);

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
    retry: false, // 404 = belum ada profil
  });

  const matchesQ = useQuery({
    queryKey: ["matches", radiusM],
    queryFn: () => matchBloods(radiusM),
    enabled: !!profileQ.data,
  });

  const profile = profileQ.data;
  const matches = (matchesQ.data ?? []) as unknown as Match[];
  const donorCoord = profile?.location?.coordinates as
    | [number, number]
    | undefined;

  function distanceKm(loc?: { coordinates: [number, number] } | null) {
    if (!donorCoord || !loc) return null;
    return haversineKm(
      { latitude: donorCoord[1], longitude: donorCoord[0] },
      { latitude: loc.coordinates[1], longitude: loc.coordinates[0] },
    );
  }

  const noProfile = profileQ.isError;

  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerClassName="px-6 pb-10"
          refreshControl={
            <RefreshControl
              refreshing={profileQ.isFetching || matchesQ.isFetching}
              onRefresh={() => {
                profileQ.refetch();
                matchesQ.refetch();
              }}
            />
          }
        >
          {/* Header */}
          <View className="mt-2 h-14 flex-row items-center justify-between">
            <View>
              <Text className="font-archivo text-caption text-ink-muted">Halo,</Text>
              <Text className="font-archivo-bold text-subjudul text-ink">
                {user?.name ?? "Pendonor"}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/(donor)/profile")}
              className="h-11 w-11 items-center justify-center rounded-card bg-primary"
            >
              <Text className="font-archivo-black text-body text-white">
                {(user?.name?.[0] ?? "V").toUpperCase()}
              </Text>
            </Pressable>
          </View>

          {profileQ.isLoading ? (
            <View className="mt-6 items-center py-10">
              <ActivityIndicator color="#EC3013" />
            </View>
          ) : noProfile ? (
            <View className="mt-6 rounded-[18px] border border-line bg-surface p-5">
              <Text className="font-archivo-bold text-body text-ink">
                Lengkapi profil dulu
              </Text>
              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                Isi golongan darah & lokasi supaya kami bisa mencocokkan kebutuhan
                untukmu.
              </Text>
              <Pressable
                onPress={() => router.push("/(donor)/profile")}
                className="mt-4 items-center rounded-pill bg-primary py-3 active:bg-primary-dark"
              >
                <Text className="font-archivo-bold text-body text-white">
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
                  {profile?.rhesus} · radius {radiusM / 1000} km
                </Text>
              </View>

              {/* Cocok untukmu */}
              <View className="mt-7 flex-row items-baseline justify-between">
                <Text className="font-archivo-bold text-judul text-ink">
                  Cocok untukmu
                </Text>
                <Text className="font-archivo text-caption text-ink-muted">
                  {matches.length} kebutuhan
                </Text>
              </View>

              {/* Chip radius */}
              <View className="mt-3 flex-row gap-2">
                {RADII.map((r) => {
                  const active = r.m === radiusM;
                  return (
                    <Pressable
                      key={r.m}
                      onPress={() => setRadiusM(r.m)}
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
                        {r.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* List */}
              {matchesQ.isLoading ? (
                <View className="mt-6 items-center py-10">
                  <ActivityIndicator color="#EC3013" />
                </View>
              ) : matches.length === 0 ? (
                <View className="mt-6 rounded-[18px] border border-line bg-surface p-5">
                  <Text className="font-archivo-bold text-body text-ink">
                    Belum ada kebutuhan cocok
                  </Text>
                  <Text className="mt-1 font-archivo text-caption text-ink-muted">
                    {profile?.eligibility.is_eligible
                      ? "Tidak ada permintaan cocok dengan golonganmu di radius ini. Coba perbesar radius."
                      : "Kamu belum boleh donor sekarang, jadi kebutuhan belum ditampilkan."}
                  </Text>
                </View>
              ) : (
                <View className="mt-4 gap-3">
                  {matches.map((b) => (
                    <MatchCard
                      key={b.id}
                      blood={b}
                      distance={distanceKm(b.hospital?.location)}
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

function MatchCard({
  blood,
  distance,
}: {
  blood: Match;
  distance: number | null;
}) {
  const urgent = blood.status_blood === "urgent";
  return (
    <View className="rounded-[18px] border border-line bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <View
          className={`rounded-pill px-3 py-1 ${urgent ? "bg-primary" : "bg-ground"}`}
        >
          <Text
            className={`font-archivo-bold text-overline tracking-overline ${
              urgent ? "text-white" : "text-ink-muted"
            }`}
          >
            {urgent ? "MENDESAK" : "TERJADWAL"}
          </Text>
        </View>
        <View className="rounded-pill bg-primary-soft px-3 py-1">
          <Text className="font-archivo-bold text-caption text-primary-dark">
            {blood.blood_type}
            {blood.rhesus}
          </Text>
        </View>
      </View>

      <Text className="mt-3 font-archivo-bold text-body text-ink">
        {blood.hospital?.hospital_name ?? "Fasilitas kesehatan"}
      </Text>
      <Text className="mt-1 font-archivo text-caption text-ink-muted">
        {distance != null ? `${distance.toFixed(1)} km · ` : ""}
        {formatSchedule(blood.schedule)}
      </Text>
      <Text className="mt-2 font-archivo-semibold text-caption text-ink">
        {blood.quantity} kantong dibutuhkan
      </Text>
    </View>
  );
}
