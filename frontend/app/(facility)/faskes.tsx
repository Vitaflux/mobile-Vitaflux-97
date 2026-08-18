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
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, LogOut, MapPin, ShieldCheck } from "lucide-react-native";
import { getMyHospital } from "../../src/api/hospitals";
import { useAuth } from "../../src/store/auth";

export default function FacilityProfile() {
  const logout = useAuth((state) => state.logout);

  const q = useQuery({
    queryKey: ["my-hospital"],
    queryFn: () => getMyHospital(),
  });

  const hospital = q.data;

  async function onLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

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
            Faskes
          </Text>

          <Text className="mt-1 font-archivo text-caption text-ink-muted">
            Profil fasilitas kesehatan
          </Text>

          {q.isLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator color="#EC3013" />

              <Text className="mt-3 font-archivo text-caption text-ink-muted">
                Memuat profil faskes...
              </Text>
            </View>
          ) : q.isError ? (
            <View className="p-5 mt-6 border rounded-card border-line bg-surface">
              <Text className="font-archivo-bold text-body text-ink">
                Profil belum dapat dimuat
              </Text>

              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                Periksa koneksi lalu coba lagi.
              </Text>

              <Pressable
                onPress={() => q.refetch()}
                className="items-center py-3 mt-4 rounded-pill bg-primary active:bg-primary-dark"
              >
                <Text className="text-white font-archivo-bold text-body">
                  Coba lagi
                </Text>
              </Pressable>
            </View>
          ) : hospital ? (
            <>
              {/* Header profil */}
              <View className="p-5 mt-6 border rounded-card border-line bg-surface">
                <View className="flex-row items-center">
                  <View className="items-center justify-center mr-4 w-14 h-14 rounded-card bg-primary">
                    <Building2 color="#FFFFFF" size={28} />
                  </View>

                  <View className="flex-1">
                    <Text className="font-archivo-bold text-subjudul text-ink">
                      {hospital.hospital_name}
                    </Text>

                    <View className="flex-row items-center self-start px-3 py-1 mt-2 rounded-pill bg-primary-soft">
                      <ShieldCheck color="#A31B0A" size={14} />

                      <Text className="ml-1 font-archivo-bold text-overline tracking-overline text-primary-dark">
                        {hospital.isVerified
                          ? "TERVERIFIKASI"
                          : "BELUM TERVERIFIKASI"}
                      </Text>
                    </View>
                  </View>
                </View>

                {hospital.hospital_type ? (
                  <Text className="mt-4 font-archivo text-caption text-ink-muted">
                    {hospital.hospital_type}
                  </Text>
                ) : null}

                {hospital.address ? (
                  <View className="flex-row items-start mt-3">
                    <MapPin color="#605D5D" size={18} />

                    <Text className="flex-1 ml-2 font-archivo text-caption text-ink-muted">
                      {hospital.address}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Data fasilitas */}
              <Text className="mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
                DATA FASILITAS
              </Text>

              <View className="p-5 mt-3 border rounded-card border-line bg-surface">
                <InfoRow label="Kode fasilitas" value={hospital.code} />

                <InfoRow label="Unit donor" value={hospital.unit_donor} />

                <InfoRow label="Penanggung jawab" value={hospital.pic_name} />

                <InfoRow label="Kontak" value={hospital.contact} last />
              </View>

              {/* Statistik */}
              <Text className="mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
                STATISTIK
              </Text>

              <View className="flex-row gap-3 mt-3">
                <View className="flex-1 p-4 border rounded-card border-line bg-surface">
                  <Text className="font-archivo-black text-judul text-primary">
                    {hospital.stats.total_collected}
                  </Text>

                  <Text className="mt-1 font-archivo text-caption text-ink-muted">
                    Donasi terkumpul
                  </Text>
                </View>

                <View className="flex-1 p-4 border rounded-card border-line bg-surface">
                  <Text className="font-archivo-black text-judul text-ink">
                    {hospital.stats.attendance_rate}%
                  </Text>

                  <Text className="mt-1 font-archivo text-caption text-ink-muted">
                    Kehadiran
                  </Text>
                </View>
              </View>

              {/* Logout */}
              <Pressable
                onPress={onLogout}
                className="flex-row items-center justify-center py-4 border mt-7 rounded-pill border-primary active:bg-primary-soft"
              >
                <LogOut color="#A31B0A" size={20} />

                <Text className="ml-2 font-archivo-bold text-body text-primary-dark">
                  Keluar
                </Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
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
  value?: string | null;
  last?: boolean;
}) {
  return (
    <View className={last ? "" : "pb-4 mb-4 border-b border-line"}>
      <Text className="font-archivo text-caption text-ink-muted">{label}</Text>

      <Text className="mt-1 font-archivo-semibold text-body text-ink">
        {value || "-"}
      </Text>
    </View>
  );
}
