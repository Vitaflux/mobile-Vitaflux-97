import { useCallback } from "react";
import { View, Text, Pressable, ScrollView, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { MapPin, Navigation } from "lucide-react-native";
import MapView, { Marker } from "react-native-maps";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "../../src/api/profiles";
import { matchBloods } from "../../src/api/bloods";

type Detail = {
  id: string;
  blood_type: string;
  rhesus: string;
  quantity: number;
  status_blood: "normal" | "urgent" | "closed";
  schedule: string;
  schedule_end?: string | null;
  distanceKm?: number | null;
  title?: string | null;
  note?: string | null;
  component?: string | null;
  applicants_count?: number;
  collected?: number;
  hospital: {
    hospital_name: string;
    address?: string | null;
    location?: {
      type?: "Point";
      coordinates: [number, number];
    };
  } | null;
};

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

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

const SYARAT = [
  "Usia 17–65 tahun, berat minimal 45 kg",
  "Tidur cukup dan tidak sedang demam",
  "Lolos skrining awal dan pemeriksaan petugas",
];

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
  } ${start.getFullYear()}`;

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

function parseDetail(value?: string): Detail | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as Detail;
  } catch {
    return null;
  }
}

function calculateDistanceKm(from: [number, number], to: [number, number]) {
  const [fromLongitude, fromLatitude] = from;
  const [toLongitude, toLatitude] = to;

  const toRadians = (value: number) => (value * Math.PI) / 180;

  const latitudeDifference = toRadians(toLatitude - fromLatitude);

  const longitudeDifference = toRadians(toLongitude - fromLongitude);

  const firstLatitude = toRadians(fromLatitude);
  const secondLatitude = toRadians(toLatitude);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return 6371 * c;
}

function estimateTravelTime(distanceKm?: number | null) {
  if (typeof distanceKm !== "number" || !Number.isFinite(distanceKm)) {
    return null;
  }

  // Estimasi kendaraan dengan kecepatan rata-rata 25 km/jam.
  const minutes = Math.max(5, Math.round((distanceKm / 25) * 60));

  if (minutes < 60) {
    return `±${minutes} menit`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `±${hours} jam ${remainingMinutes} menit`
    : `±${hours} jam`;
}

export default function BloodDetail() {
  const params = useLocalSearchParams<{
    data?: string;
    radius?: string;
  }>();

  const initialDetail = parseDetail(params.data);

  const parsedRadius = Number(params.radius);

  const radiusMeters =
    Number.isFinite(parsedRadius) && parsedRadius >= 1 && parsedRadius <= 20000
      ? parsedRadius
      : 10000;

  const matchesQuery = useQuery({
    queryKey: ["matches", radiusMeters],
    queryFn: () => matchBloods(radiusMeters),
    enabled: false,
  });

  const refetchMatches = matchesQuery.refetch;
  const detailId = initialDetail?.id;

  useFocusEffect(
    useCallback(() => {
      if (!detailId) return;

      void refetchMatches();
    }, [detailId, refetchMatches]),
  );

  const refreshedDetail = matchesQuery.data?.find(
    (blood) => blood.id === initialDetail?.id,
  ) as Detail | undefined;

  const detail = refreshedDetail
    ? {
        ...initialDetail,
        ...refreshedDetail,
        distanceKm: initialDetail?.distanceKm,
      }
    : initialDetail;

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
    enabled: Boolean(detail),
  });

  if (!detail) {
    return (
      <View className="items-center justify-center flex-1 px-6 bg-ground">
        <Text className="font-archivo text-body text-ink-muted">
          Data kebutuhan tidak ditemukan.
        </Text>

        <Pressable
          onPress={() => router.back()}
          className="px-6 py-3 mt-4 border rounded-pill border-line"
        >
          <Text className="font-archivo-semibold text-body text-ink">
            Kembali
          </Text>
        </Pressable>
      </View>
    );
  }

  const urgent = detail.status_blood === "urgent";

  const hospitalName = detail.hospital?.hospital_name ?? "Fasilitas kesehatan";

  const coordinates = detail.hospital?.location?.coordinates;

  const longitude = coordinates?.[0];

  const latitude = coordinates?.[1];

  const hasCoordinates =
    typeof latitude === "number" && typeof longitude === "number";

  const donorCoordinates = profileQuery.data?.location?.coordinates;

  const calculatedDistance =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Array.isArray(donorCoordinates) &&
    donorCoordinates.length === 2
      ? calculateDistanceKm(donorCoordinates as [number, number], [
          longitude,
          latitude,
        ])
      : null;

  const displayedDistanceKm =
    typeof detail.distanceKm === "number"
      ? detail.distanceKm
      : calculatedDistance;

  const travelTime = estimateTravelTime(displayedDistanceKm);

  const component = detail.component
    ? (COMPONENT_LABELS[detail.component] ?? detail.component)
    : "Belum ditentukan";

  const hasProgress =
    typeof detail.applicants_count === "number" &&
    typeof detail.collected === "number";

  const collected = detail.collected ?? 0;

  const progress =
    detail.quantity <= 0
      ? 0
      : Math.min(100, Math.round((collected / detail.quantity) * 100));

  function onRegister() {
    router.push({
      pathname: "/(donor)/screening",
      params: {
        data: params.data,
      },
    });
  }

  async function openMaps() {
    if (!hasCoordinates) {
      return;
    }

    const url =
      `https://www.google.com/maps/search/?api=1` +
      `&query=${latitude},${longitude}`;

    await Linking.openURL(url);
  }

  return (
    <View className="flex-1 bg-surface">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="px-6 pb-6">
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
              Kebutuhan darah
            </Text>
          </View>

          {/* Identity */}
          <View className="flex-row items-start mt-2">
            <View className="items-center justify-center w-20 h-20 rounded-sheet bg-primary">
              <Text className="leading-none text-white font-archivo-black text-display">
                {detail.blood_type}
              </Text>

              <Text className="mt-1 text-white font-archivo-bold text-body">
                {detail.rhesus}
              </Text>
            </View>

            <View className="flex-1 ml-4">
              <View
                className={`self-start rounded-pill px-3 py-1 ${
                  urgent ? "bg-primary-soft" : "border border-line bg-surface"
                }`}
              >
                <Text
                  className={`font-archivo-bold text-overline tracking-overline ${
                    urgent ? "text-primary-dark" : "text-ink-muted"
                  }`}
                >
                  {urgent ? "MENDESAK" : "TERJADWAL"}
                </Text>
              </View>

              <Text className="mt-2 leading-tight font-archivo-black text-subjudul text-ink">
                {hospitalName}
              </Text>

              <Text className="mt-1 font-archivo-medium text-caption text-ink-muted">
                {detail.title || "Kebutuhan darah"}
              </Text>
            </View>
          </View>

          {detail.hospital?.address ? (
            <View className="flex-row items-start mt-4">
              <MapPin color="#605D5D" size={17} />

              <Text className="flex-1 ml-2 font-archivo text-caption text-ink-muted">
                {detail.hospital.address}
              </Text>
            </View>
          ) : null}

          <View className="h-0.5 my-5 bg-ground" />

          {/* Information */}
          <View className="flex-row">
            <View className="flex-1 pr-3">
              <Metric
                label="Jarak"
                value={
                  typeof displayedDistanceKm === "number"
                    ? `${displayedDistanceKm.toFixed(1)} km${
                        travelTime ? ` · perkiraan ${travelTime}` : ""
                      }`
                    : "Belum tersedia"
                }
              />
            </View>

            <View className="flex-1 pl-3">
              <Metric
                label="Jadwal"
                value={formatSchedule(detail.schedule, detail.schedule_end)}
              />
            </View>
          </View>

          <View className="flex-row mt-5">
            <View className="flex-1 pr-3">
              <Metric label="Komponen" value={component} />
            </View>

            <View className="flex-1 pl-3">
              <Metric
                label={hasProgress ? "Terkumpul" : "Dibutuhkan"}
                value={
                  hasProgress
                    ? `${collected} / ${detail.quantity} kantong`
                    : `${detail.quantity} kantong`
                }
              />
            </View>
          </View>

          {/* Progress */}
          {hasProgress ? (
            <View className="mt-4">
              <View className="h-1.5 overflow-hidden rounded-pill bg-ground">
                <View
                  className="h-full rounded-pill bg-primary"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </View>

              <Text className="mt-2 font-archivo text-caption text-ink-muted">
                {detail.applicants_count} pendaftar
              </Text>
            </View>
          ) : null}

          {/* Map */}
          <Text className="mb-3 mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
            LOKASI FASKES
          </Text>

          {hasCoordinates ? (
            <>
              <View className="h-36 overflow-hidden rounded-[18px] border border-line bg-surface">
                <MapView
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  initialRegion={{
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude,
                      longitude,
                    }}
                    title={detail.hospital?.hospital_name}
                    description={detail.hospital?.address ?? undefined}
                  />
                </MapView>
              </View>

              <Pressable
                onPress={openMaps}
                className="flex-row items-center justify-center py-3 mt-3 border rounded-pill border-line bg-surface active:bg-ground"
              >
                <Navigation color="#A31B0A" size={18} />

                <Text className="ml-2 font-archivo-bold text-body text-primary-dark">
                  Buka di Google Maps
                </Text>
              </Pressable>
            </>
          ) : (
            <View className="items-center justify-center h-36 rounded-[18px] border border-line bg-surface">
              <MapPin color="#605D5D" size={28} />

              <Text className="mt-2 font-archivo text-caption text-ink-muted">
                Koordinat faskes belum tersedia.
              </Text>
            </View>
          )}

          {/* Facility note */}
          {detail.note ? (
            <>
              <Text className="mb-3 mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
                CATATAN DARI FASKES
              </Text>

              <Text className="leading-6 font-archivo text-body text-ink">
                {detail.note}
              </Text>
            </>
          ) : null}

          {/* Requirements */}
          <Text className="mb-3 mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
            SYARAT SINGKAT
          </Text>

          <View className="gap-2">
            {SYARAT.map((requirement) => (
              <View key={requirement} className="flex-row items-start">
                <Text className="mr-2 font-archivo-bold text-body text-primary-dark">
                  •
                </Text>

                <Text className="flex-1 font-archivo text-body text-ink">
                  {requirement}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* CTA */}
        <View className="px-6 pt-3 pb-2 border-t border-line bg-surface">
          <Pressable
            onPress={onRegister}
            className="items-center py-4 rounded-pill bg-primary active:bg-primary-dark"
          >
            <Text className="text-white font-archivo-bold text-body">
              Daftar Donor
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View>
      <Text className="font-archivo-bold text-overline tracking-overline text-ink-muted">
        {label.toUpperCase()}
      </Text>

      <Text className="mt-1 font-archivo-bold text-subjudul text-ink">
        {value}
      </Text>
    </View>
  );
}
