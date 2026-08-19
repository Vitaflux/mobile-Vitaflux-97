import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import QRCode from "react-native-qrcode-svg";
import { LockKeyhole } from "lucide-react-native";
import { myRequests } from "../../src/api/requests";

const STEPS = [
  {
    key: "registered",
    label: "Terdaftar",
    desc: "Pendaftaranmu diterima.",
  },
  {
    key: "confirmed",
    label: "Dikonfirmasi",
    desc: "Faskes mengonfirmasi kehadiranmu.",
  },
  {
    key: "done",
    label: "Selesai",
    desc: "Check-in & donasi tercatat.",
  },
];

const IDX: Record<string, number> = {
  registered: 0,
  confirmed: 1,
  done: 2,
};

type Req = {
  id: string;
  status: "registered" | "confirmed" | "done";
  qr_token?: string;
  code?: string | null;
  blood?: {
    id: string;
    blood_type: string;
    rhesus: string;
    quantity: number;
    title?: string | null;
  } | null;
  hospital?: {
    hospital_name: string;
  } | null;
};

export default function Status() {
  const q = useQuery({
    queryKey: ["my-requests"],
    queryFn: () => myRequests(),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const requests = (q.data ?? []) as Req[];

  // ObjectId MongoDB berurutan berdasarkan waktu pembuatan. Tampilkan
  // pendaftaran terbaru agar status lama tidak menutupi hasil konfirmasi
  // atau check-in yang baru saja dilakukan.
  const req =
    [...requests].sort((first, second) =>
      second.id.localeCompare(first.id),
    )[0] ?? null;

  if (q.isLoading) {
    return (
      <View className="items-center justify-center flex-1 bg-ground">
        <ActivityIndicator color="#EC3013" />

        <Text className="mt-3 font-archivo text-caption text-ink-muted">
          Memuat status pendaftaran...
        </Text>
      </View>
    );
  }

  if (q.isError) {
    return (
      <View className="items-center justify-center flex-1 px-6 bg-ground">
        <Text className="text-center font-archivo-bold text-body text-ink">
          Status belum dapat dimuat
        </Text>

        <Text className="mt-1 text-center font-archivo text-caption text-ink-muted">
          Periksa koneksi lalu coba lagi.
        </Text>

        <Pressable
          onPress={() => q.refetch()}
          className="px-6 py-3 mt-4 rounded-pill bg-primary active:bg-primary-dark"
        >
          <Text className="text-white font-archivo-bold text-body">
            Coba lagi
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!req) {
    return (
      <View className="items-center justify-center flex-1 px-6 bg-ground">
        <Text className="font-archivo-bold text-body text-ink">
          Belum ada pendaftaran
        </Text>

        <Text className="mt-1 text-center font-archivo text-caption text-ink-muted">
          Pilih kebutuhan darah dari Beranda untuk mulai mendaftar.
        </Text>

        <Pressable
          onPress={() => router.replace("/(donor)")}
          className="px-6 py-3 mt-4 border rounded-pill border-line bg-surface"
        >
          <Text className="font-archivo-semibold text-body text-ink">
            Ke Beranda
          </Text>
        </Pressable>
      </View>
    );
  }

  const current = IDX[req.status] ?? 0;
  const qrActive = req.status === "confirmed" && Boolean(req.qr_token);

  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="px-6 pb-10">
          {/* Header */}
          <View className="flex-row items-center h-12">
            <Pressable
              onPress={() => router.replace("/(donor)")}
              hitSlop={8}
              className="mr-3"
            >
              <Text className="text-2xl text-ink">←</Text>
            </Pressable>

            <Text className="font-archivo-semibold text-body text-ink">
              Status pendaftaran
            </Text>
          </View>

          {/* Konteks kebutuhan */}
          {req.hospital?.hospital_name && (
            <View className="mt-2 rounded-[18px] border border-line bg-surface p-4">
              <Text className="font-archivo-bold text-body text-ink">
                {req.hospital.hospital_name}
              </Text>

              {req.blood && (
                <Text className="mt-1 font-archivo text-caption text-ink-muted">
                  {req.blood.blood_type}
                  {req.blood.rhesus} · {req.blood.quantity} kantong
                </Text>
              )}
            </View>
          )}

          {/* Stepper */}
          <View className="mt-6">
            {STEPS.map((step, index) => {
              const active = index <= current;
              const isLast = index === STEPS.length - 1;

              return (
                <View key={step.key} className="flex-row">
                  <View className="items-center mr-4">
                    <View
                      className={`h-8 w-8 items-center justify-center rounded-pill ${
                        active ? "bg-primary" : "border border-line bg-surface"
                      }`}
                    >
                      <Text
                        className={`font-archivo-black text-caption ${
                          active ? "text-white" : "text-ink-muted"
                        }`}
                      >
                        {index + 1}
                      </Text>
                    </View>

                    {!isLast && (
                      <View
                        className={`w-0.5 flex-1 ${
                          index < current ? "bg-primary" : "bg-line"
                        }`}
                        style={{ minHeight: 36 }}
                      />
                    )}
                  </View>

                  <View className={`flex-1 ${isLast ? "" : "pb-6"}`}>
                    <Text
                      className={`font-archivo-bold text-body ${
                        active ? "text-ink" : "text-ink-muted"
                      }`}
                    >
                      {step.label}
                    </Text>

                    <Text className="mt-0.5 font-archivo text-caption text-ink-muted">
                      {step.desc}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* QR check-in */}
          <Text className="mt-4 mb-3 font-archivo-bold text-overline tracking-overline text-ink-muted">
            QR CHECK-IN
          </Text>

          <View className="items-center rounded-[18px] border border-line bg-surface p-6">
            {qrActive ? (
              <>
                <QRCode
                  value={req.qr_token!}
                  size={200}
                  color="#201E1D"
                  backgroundColor="#FFFFFF"
                />

                <Text className="mt-4 text-center font-archivo text-caption text-ink-muted">
                  Tunjukkan QR ini ke petugas faskes untuk check-in.
                </Text>
              </>
            ) : req.status === "registered" ? (
              <>
                <View className="items-center justify-center w-28 h-28 rounded-[18px] bg-ground">
                  <LockKeyhole color="#605D5D" size={42} />
                </View>

                <Text className="mt-4 text-center font-archivo-bold text-body text-ink">
                  QR masih terkunci
                </Text>

                <Text className="mt-1 text-center font-archivo text-caption text-ink-muted">
                  QR aktif setelah faskes mengonfirmasi pendaftaranmu.
                </Text>
              </>
            ) : (
              <>
                <Text className="font-archivo-bold text-body text-ink">
                  Donasi selesai
                </Text>

                <Text className="mt-1 text-center font-archivo text-caption text-ink-muted">
                  Check-in dan donasimu sudah tercatat.
                </Text>
              </>
            )}

            {req.code ? (
              <View className="px-4 py-2 mt-4 rounded-pill bg-ground">
                <Text className="font-archivo-bold text-body text-ink">
                  Kode kehadiran: {req.code}
                </Text>
              </View>
            ) : null}
          </View>

          <Text className="mt-4 text-center font-archivo text-caption text-ink-muted">
            Status diperbarui otomatis saat petugas mengonfirmasi atau memindai
            QR-mu.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
