import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "@tanstack/react-query";
import { myRequests } from "../../src/api/requests";

type HistoryRequest = {
  id: string;
  status: "done";
  checked_in_at?: string | null;
  blood?: {
    id: string;
    blood_type: string;
    rhesus: string;
    quantity: number;
    schedule?: string;
    title?: string | null;
  } | null;
  hospital?: {
    hospital_name: string;
    address?: string | null;
  } | null;
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

function formatDate(value?: string | null) {
  if (!value) return "Tanggal belum tersedia";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tanggal belum tersedia";
  }

  return `${HARI[date.getDay()]}, ${date.getDate()} ${
    BULAN[date.getMonth()]
  } ${date.getFullYear()}`;
}

export default function Riwayat() {
  const q = useQuery({
    queryKey: ["my-requests", "done"],
    queryFn: () => myRequests("done"),
  });

  const histories = (q.data ?? []) as HistoryRequest[];

  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerClassName="px-6 pb-10"
          refreshControl={
            <RefreshControl
              refreshing={q.isFetching}
              onRefresh={() => q.refetch()}
            />
          }
        >
          <Text className="pt-4 font-archivo-bold text-judul text-ink">
            Riwayat donor
          </Text>

          <Text className="mt-1 font-archivo text-caption text-ink-muted">
            Donasi yang sudah selesai dan tercatat.
          </Text>

          {q.isLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator color="#EC3013" />

              <Text className="mt-3 font-archivo text-caption text-ink-muted">
                Memuat riwayat donor...
              </Text>
            </View>
          ) : q.isError ? (
            <View className="p-5 mt-6 border rounded-card border-line bg-surface">
              <Text className="font-archivo-bold text-body text-ink">
                Riwayat belum dapat dimuat
              </Text>

              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                Periksa koneksi lalu coba lagi.
              </Text>

              <Pressable
                onPress={() => q.refetch()}
                className="items-center py-3 mt-4 rounded-pill bg-primary"
              >
                <Text className="text-white font-archivo-bold text-body">
                  Coba lagi
                </Text>
              </Pressable>
            </View>
          ) : histories.length === 0 ? (
            <View className="p-5 mt-6 border rounded-card border-line bg-surface">
              <Text className="font-archivo-semibold text-body text-ink">
                Belum ada riwayat
              </Text>

              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                Donasi yang sudah selesai akan muncul di sini.
              </Text>
            </View>
          ) : (
            <>
              {/* Ringkasan */}
              <View className="flex-row gap-3 mt-6">
                <View className="flex-1 p-4 border rounded-card border-line bg-surface">
                  <Text className="font-archivo-black text-judul text-primary">
                    {histories.length}
                  </Text>

                  <Text className="mt-1 font-archivo text-caption text-ink-muted">
                    Donasi
                  </Text>
                </View>

                <View className="flex-1 p-4 border rounded-card border-line bg-surface">
                  <Text className="font-archivo-black text-judul text-ink">
                    Selesai
                  </Text>

                  <Text className="mt-1 font-archivo text-caption text-ink-muted">
                    Status
                  </Text>
                </View>
              </View>

              <Text className="mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
                DAFTAR DONASI
              </Text>

              <View className="gap-3 mt-3">
                {histories.map((history) => (
                  <View
                    key={history.id}
                    className="p-5 border rounded-card border-line bg-surface"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-3">
                        <Text className="font-archivo-bold text-body text-ink">
                          {history.hospital?.hospital_name ??
                            "Fasilitas kesehatan"}
                        </Text>

                        <Text className="mt-1 font-archivo text-caption text-ink-muted">
                          {formatDate(
                            history.checked_in_at ?? history.blood?.schedule,
                          )}
                        </Text>
                      </View>

                      <View className="px-3 py-1 rounded-pill bg-primary-soft">
                        <Text className="font-archivo-bold text-overline tracking-overline text-primary-dark">
                          SELESAI
                        </Text>
                      </View>
                    </View>

                    {history.blood && (
                      <View className="pt-4 mt-4 border-t border-line">
                        <Text className="font-archivo-semibold text-body text-ink">
                          Golongan darah {history.blood.blood_type}
                          {history.blood.rhesus}
                        </Text>

                        {history.blood.title ? (
                          <Text className="mt-1 font-archivo text-caption text-ink-muted">
                            {history.blood.title}
                          </Text>
                        ) : null}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
