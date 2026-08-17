import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";

const STEPS = [
  { key: "registered", label: "Terdaftar", desc: "Pendaftaranmu diterima." },
  {
    key: "confirmed",
    label: "Dikonfirmasi",
    desc: "Faskes mengonfirmasi kehadiranmu.",
  },
  { key: "done", label: "Selesai", desc: "Check-in & donasi tercatat." },
];
const IDX: Record<string, number> = { registered: 0, confirmed: 1, done: 2 };

type Req = {
  id: string;
  status: "registered" | "confirmed" | "done";
  qr_token: string;
  bloods_id: string;
};

export default function Status() {
  const params = useLocalSearchParams<{ req?: string; data?: string }>();
  let req: Req | null = null;
  let keb: any = null;
  try {
    req = params.req ? (JSON.parse(params.req) as Req) : null;
  } catch {
    req = null;
  }
  try {
    keb = params.data ? JSON.parse(params.data) : null;
  } catch {
    keb = null;
  }

  if (!req) {
    return (
      <View className="flex-1 items-center justify-center bg-ground px-6">
        <Text className="font-archivo text-body text-ink-muted">
          Data pendaftaran tidak ditemukan.
        </Text>
        <Pressable
          onPress={() => router.replace("/(donor)")}
          className="mt-4 rounded-pill border border-line px-6 py-3"
        >
          <Text className="font-archivo-semibold text-body text-ink">
            Ke Beranda
          </Text>
        </Pressable>
      </View>
    );
  }

  const current = IDX[req.status] ?? 0;

  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="px-6 pb-10">
          <View className="h-12 flex-row items-center">
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
          {keb?.hospital?.hospital_name && (
            <View className="mt-2 rounded-[18px] border border-line bg-surface p-4">
              <Text className="font-archivo-bold text-body text-ink">
                {keb.hospital.hospital_name}
              </Text>
              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                {keb.blood_type}
                {keb.rhesus} · {keb.quantity} kantong
              </Text>
            </View>
          )}

          {/* Stepper */}
          <View className="mt-6">
            {STEPS.map((s, i) => {
              const done = i <= current;
              const isLast = i === STEPS.length - 1;
              return (
                <View key={s.key} className="flex-row">
                  <View className="mr-4 items-center">
                    <View
                      className={`h-8 w-8 items-center justify-center rounded-pill ${
                        done ? "bg-primary" : "border border-line bg-surface"
                      }`}
                    >
                      <Text
                        className={`font-archivo-black text-caption ${
                          done ? "text-white" : "text-ink-muted"
                        }`}
                      >
                        {i + 1}
                      </Text>
                    </View>
                    {!isLast && (
                      <View
                        className={`w-0.5 flex-1 ${
                          i < current ? "bg-primary" : "bg-line"
                        }`}
                        style={{ minHeight: 36 }}
                      />
                    )}
                  </View>
                  <View className={`flex-1 ${isLast ? "" : "pb-6"}`}>
                    <Text
                      className={`font-archivo-bold text-body ${
                        done ? "text-ink" : "text-ink-muted"
                      }`}
                    >
                      {s.label}
                    </Text>
                    <Text className="mt-0.5 font-archivo text-caption text-ink-muted">
                      {s.desc}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <Text className="mt-6 text-center font-archivo text-caption text-ink-muted">
            Status diperbarui saat petugas mengonfirmasi atau memindai QR-mu.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
