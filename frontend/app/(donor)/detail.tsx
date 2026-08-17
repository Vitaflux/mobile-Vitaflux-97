import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";

type Detail = {
  id: string;
  blood_type: string;
  rhesus: string;
  quantity: number;
  status_blood: "normal" | "urgent" | "closed";
  schedule: string;
  distanceKm: number | null;
  hospital: {
    hospital_name: string;
    location?: { coordinates: [number, number] };
  } | null;
};

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function formatSchedule(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const jam = `${String(d.getHours()).padStart(2, "0")}.${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} · ${jam}`;
}

const SYARAT = [
  "Usia 17–65 tahun, berat ≥ 45 kg",
  "Tidur cukup, tidak sedang demam",
  "Minimal 60 hari sejak donor terakhir",
];

export default function BloodDetail() {
  const params = useLocalSearchParams<{ data?: string }>();
  let d: Detail | null = null;
  try {
    d = params.data ? (JSON.parse(params.data) as Detail) : null;
  } catch {
    d = null;
  }

  if (!d) {
    return (
      <View className="flex-1 items-center justify-center bg-ground px-6">
        <Text className="font-archivo text-body text-ink-muted">
          Data kebutuhan tidak ditemukan.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 rounded-pill border border-line px-6 py-3"
        >
          <Text className="font-archivo-semibold text-body text-ink">Kembali</Text>
        </Pressable>
      </View>
    );
  }

  const urgent = d.status_blood === "urgent";

  function onDaftar() {
    // Ke skrining kesehatan (D-07); teruskan data kebutuhan.
    router.push({
      pathname: "/(donor)/screening",
      params: { data: params.data },
    });
  }

  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="px-6 pb-6">
          <View className="h-12 flex-row items-center">
            <Pressable onPress={() => router.back()} hitSlop={8} className="mr-3">
              <Text className="text-2xl text-ink">←</Text>
            </Pressable>
            <Text className="font-archivo-semibold text-body text-ink">
              Kebutuhan darah
            </Text>
          </View>

          {/* Badge + golongan */}
          <View className="mt-2 flex-row items-center justify-between">
            <View
              className={`rounded-pill px-3 py-1 ${urgent ? "bg-primary" : "bg-surface border border-line"}`}
            >
              <Text
                className={`font-archivo-bold text-overline tracking-overline ${
                  urgent ? "text-white" : "text-ink-muted"
                }`}
              >
                {urgent ? "MENDESAK" : "TERJADWAL"}
              </Text>
            </View>
            <View className="rounded-pill bg-primary-soft px-4 py-1.5">
              <Text className="font-archivo-black text-body text-primary-dark">
                {d.blood_type}
                {d.rhesus}
              </Text>
            </View>
          </View>

          {/* Faskes */}
          <Text className="mt-4 font-archivo-bold text-judul leading-tight text-ink">
            {d.hospital?.hospital_name ?? "Fasilitas kesehatan"}
          </Text>
          {d.distanceKm != null && (
            <Text className="mt-1 font-archivo text-body text-ink-muted">
              {d.distanceKm.toFixed(1)} km dari lokasimu
            </Text>
          )}

          {/* Info */}
          <View className="mt-6 rounded-[18px] border border-line bg-surface">
            <InfoRow label="Jadwal" value={formatSchedule(d.schedule)} />
            <InfoRow label="Golongan" value={`${d.blood_type}${d.rhesus}`} />
            <InfoRow
              label="Dibutuhkan"
              value={`${d.quantity} kantong`}
              last
            />
          </View>

          {/* Peta placeholder */}
          <View className="mt-4 h-36 items-center justify-center rounded-[18px] bg-primary-soft">
            <Text className="font-archivo-bold text-overline tracking-overline text-primary-dark">
              PETA
            </Text>
            <Text className="mt-1 font-archivo text-caption text-ink-muted">
              lokasi faskes (menyusul)
            </Text>
          </View>

          {/* Syarat singkat */}
          <Text className="mb-3 mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
            SYARAT SINGKAT
          </Text>
          <View className="gap-2">
            {SYARAT.map((s) => (
              <View key={s} className="flex-row items-start">
                <Text className="mr-2 font-archivo-bold text-body text-primary-dark">
                  •
                </Text>
                <Text className="flex-1 font-archivo text-body text-ink">{s}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* CTA tetap di bawah */}
        <View className="border-t border-line bg-ground px-6 pb-2 pt-3">
          <Pressable
            onPress={onDaftar}
            className="items-center rounded-pill bg-primary py-4 active:bg-primary-dark"
          >
            <Text className="font-archivo-bold text-body text-white">
              Daftar Donor
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
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-4 ${
        last ? "" : "border-b border-line"
      }`}
    >
      <Text className="font-archivo text-body text-ink-muted">{label}</Text>
      <Text className="font-archivo-semibold text-body text-ink">{value}</Text>
    </View>
  );
}
