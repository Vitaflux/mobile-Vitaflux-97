import { View, Text, Pressable, ScrollView, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { MapPin, Navigation } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "../../src/api/profiles";

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
  is_compatible?: boolean;
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
  if (!value) {
    return null;
  }

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
  }>();

  const detail = parseDetail(params.data);

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

  const hospitalAddress =
    detail.hospital?.address ?? "Alamat faskes belum tersedia";

  const coordinates = detail.hospital?.location?.coordinates;

  const longitude = coordinates?.[0];
  const latitude = coordinates?.[1];

  const hasCoordinates =
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude);

  const donorCoordinates = profileQuery.data?.location?.coordinates;

  const calculatedDistance =
    hasCoordinates &&
    Array.isArray(donorCoordinates) &&
    donorCoordinates.length === 2
      ? calculateDistanceKm(donorCoordinates as [number, number], [
          longitude,
          latitude,
        ])
      : null;

  const displayedDistanceKm =
    typeof detail.distanceKm === "number" && Number.isFinite(detail.distanceKm)
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

  const isCompatible = detail.is_compatible !== false;

  function onRegister() {
    router.push({
      pathname: "/(donor)/screening",
      params: {
        data: params.data,
      },
    });
  }

  async function openMaps() {
    let url: string;

    if (hasCoordinates) {
      url =
        "https://www.google.com/maps/search/?api=1" +
        `&query=${latitude},${longitude}`;
    } else {
      const query = encodeURIComponent(
        `${hospitalName} ${detail?.hospital?.address ?? ""}`,
      );

      url = "https://www.google.com/maps/search/?api=1" + `&query=${query}`;
    }

    await Linking.openURL(url);
  }

  return (
    <View className="flex-1 bg-ground">
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

          {/* Badge */}
          <View className="flex-row items-center justify-between mt-2">
            <View
              className={`rounded-pill px-3 py-1 ${
                urgent ? "bg-primary" : "border border-line bg-surface"
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

            <View className="px-4 py-1.5 rounded-pill bg-primary-soft">
              <Text className="font-archivo-black text-body text-primary-dark">
                {detail.blood_type}
                {detail.rhesus}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text className="mt-5 leading-tight font-archivo-bold text-judul text-ink">
            {detail.title || "Kebutuhan darah"}
          </Text>

          <Text className="mt-2 font-archivo-bold text-body text-ink">
            {hospitalName}
          </Text>

          {detail.hospital?.address ? (
            <View className="flex-row items-start mt-2">
              <MapPin color="#605D5D" size={18} />

              <Text className="flex-1 ml-2 font-archivo text-caption text-ink-muted">
                {detail.hospital.address}
              </Text>
            </View>
          ) : null}

          {typeof displayedDistanceKm === "number" ? (
            <View className="flex-row items-center mt-3">
              <Navigation color="#A31B0A" size={17} />

              <Text className="ml-2 font-archivo-semibold text-caption text-primary-dark">
                {displayedDistanceKm.toFixed(1)} km dari lokasimu
                {travelTime ? ` · ETA ${travelTime}` : ""}
              </Text>
            </View>
          ) : null}

          {/* Information */}
          <View className="mt-6 rounded-[18px] border border-line bg-surface">
            <InfoRow
              label="Jadwal"
              value={formatSchedule(detail.schedule, detail.schedule_end)}
            />

            <InfoRow
              label="Golongan"
              value={`${detail.blood_type}${detail.rhesus}`}
            />

            <InfoRow label="Komponen" value={component} />

            <InfoRow
              label="Dibutuhkan"
              value={`${detail.quantity} kantong`}
              last
            />
          </View>

          {/* Progress */}
          {hasProgress ? (
            <View className="mt-4 rounded-[18px] border border-line bg-surface p-5">
              <View className="flex-row items-center justify-between">
                <Text className="font-archivo-bold text-body text-ink">
                  Terkumpul
                </Text>

                <Text className="font-archivo-bold text-body text-primary-dark">
                  {collected}/{detail.quantity}
                </Text>
              </View>

              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                {detail.applicants_count} pendaftar
              </Text>

              <View className="h-2 mt-3 overflow-hidden rounded-pill bg-ground">
                <View
                  className="h-full rounded-pill bg-primary"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </View>
            </View>
          ) : null}

          {/* Facility location */}
          <Text className="mb-3 mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
            LOKASI FASKES
          </Text>

          <View className="rounded-[18px] border border-line bg-surface p-5">
            <View className="flex-row items-start">
              <View className="items-center justify-center w-12 h-12 mr-4 rounded-card bg-primary-soft">
                <MapPin color="#A31B0A" size={24} />
              </View>

              <View className="flex-1">
                <Text className="font-archivo-bold text-body text-ink">
                  {hospitalName}
                </Text>

                <Text className="mt-1 font-archivo text-caption text-ink-muted">
                  {hospitalAddress}
                </Text>

                {typeof displayedDistanceKm === "number" ? (
                  <Text className="mt-2 font-archivo-semibold text-caption text-primary-dark">
                    {displayedDistanceKm.toFixed(1)} km
                    {travelTime ? ` · ETA ${travelTime}` : ""}
                  </Text>
                ) : null}
              </View>
            </View>

            <Pressable
              onPress={openMaps}
              className="flex-row items-center justify-center py-3 mt-4 border rounded-pill border-primary active:bg-primary-soft"
            >
              <Navigation color="#A31B0A" size={18} />

              <Text className="ml-2 font-archivo-bold text-body text-primary-dark">
                Buka di Google Maps
              </Text>
            </Pressable>
          </View>

          {/* Facility note */}
          {detail.note ? (
            <>
              <Text className="mb-3 mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
                CATATAN DARI FASKES
              </Text>

              <View className="p-5 border rounded-[18px] border-primary bg-primary-soft">
                <Text className="leading-6 font-archivo text-body text-ink">
                  {detail.note}
                </Text>
              </View>
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
        <View className="px-6 pt-3 pb-2 border-t border-line bg-ground">
          <Pressable
            onPress={onRegister}
            disabled={!isCompatible}
            className={`items-center rounded-pill py-4 ${
              isCompatible
                ? "bg-primary active:bg-primary-dark"
                : "bg-line"
            }`}
          >
            <Text
              className={`font-archivo-bold text-body ${
                isCompatible ? "text-white" : "text-ink-muted"
              }`}
            >
              {isCompatible
                ? "Daftar Donor"
                : "Tidak cocok dengan golongan darahmu"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View className={`px-4 py-4 ${last ? "" : "border-b border-line"}`}>
      <Text className="font-archivo text-caption text-ink-muted">{label}</Text>

      <Text className="mt-1 font-archivo-semibold text-body text-ink">
        {value}
      </Text>
    </View>
  );
}
