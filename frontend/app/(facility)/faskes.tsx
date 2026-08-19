import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, LogOut, MapPin } from "lucide-react-native";
import { getMyHospital, updateMyHospital } from "../../src/api/hospitals";
import { useAuth } from "../../src/store/auth";
import { useState } from "react";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { errorMessage } from "../../src/lib/errorMessage";

export default function FacilityProfile() {
  const logout = useAuth((state) => state.logout);

  const queryClient = useQueryClient();

  const [hospitalName, setHospitalName] = useState("");
  const [address, setAddress] = useState("");
  const [unitDonor, setUnitDonor] = useState("");
  const [picName, setPicName] = useState("");
  const [contact, setContact] = useState("");
  const [hospitalType, setHospitalType] = useState("");
  const [facilityCoordinates, setFacilityCoordinates] = useState<
    [number, number] | null
  >(null);
  const [locating, setLocating] = useState(false);

  const q = useQuery({
    queryKey: ["my-hospital"],
    queryFn: () => getMyHospital(),
  });

  const updateMutation = useMutation({
    mutationFn: updateMyHospital,
  });

  const hospital = q.data;

  const needsSetup =
    (q.error as { response?: { status?: number } } | null)?.response?.status ===
    404;

  async function onSetupHospital() {
    if (!hospitalName.trim() || !address.trim() || !facilityCoordinates) {
      Alert.alert(
        "Lengkapi profil",
        "Nama, alamat, dan lokasi fasilitas wajib diisi.",
      );
      return;
    }

    try {
      await updateMutation.mutateAsync({
        hospital_name: hospitalName.trim(),
        address: address.trim(),
        location: {
          type: "Point",
          coordinates: facilityCoordinates,
        },
        unit_donor: unitDonor.trim() || null,
        pic_name: picName.trim() || null,
        contact: contact.trim() || null,
        hospital_type: hospitalType.trim() || null,
      });

      await queryClient.invalidateQueries({
        queryKey: ["my-hospital"],
      });

      Alert.alert(
        "Profil tersimpan",
        "Sekarang kamu dapat menerbitkan kebutuhan darah.",
      );
    } catch (error) {
      Alert.alert(
        "Gagal menyimpan profil",
        errorMessage(error, "Periksa data atau koneksi backend."),
      );
    }
  }

  async function onSelectSetupLocation() {
    setLocating(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "Izin lokasi diperlukan",
          "Aktifkan izin lokasi untuk menentukan titik fasilitas.",
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setFacilityCoordinates([
        currentLocation.coords.longitude,
        currentLocation.coords.latitude,
      ]);
    } catch (error) {
      Alert.alert(
        "Gagal mengambil lokasi",
        errorMessage(error, "Periksa izin lokasi perangkat."),
      );
    } finally {
      setLocating(false);
    }
  }

  async function onUpdateLocation() {
    if (!hospital) {
      return;
    }

    setLocating(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "Izin lokasi diperlukan",
          "Aktifkan izin lokasi agar posisi fasilitas dapat diperbarui.",
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      await updateMutation.mutateAsync({
        hospital_name: hospital.hospital_name,
        address: hospital.address ?? "",
        location: {
          type: "Point",
          coordinates: [
            currentLocation.coords.longitude,
            currentLocation.coords.latitude,
          ],
        },
        unit_donor: hospital.unit_donor,
        pic_name: hospital.pic_name,
        contact: hospital.contact,
        hospital_type: hospital.hospital_type,
      });

      await queryClient.invalidateQueries({
        queryKey: ["my-hospital"],
      });

      Alert.alert(
        "Lokasi diperbarui",
        "Titik fasilitas sekarang mengikuti lokasi perangkat ini.",
      );
    } catch (error) {
      Alert.alert(
        "Gagal memperbarui lokasi",
        errorMessage(error, "Periksa izin lokasi atau koneksi backend."),
      );
    } finally {
      setLocating(false);
    }
  }

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
            needsSetup ? (
              <View className="p-5 mt-6 border rounded-card border-line bg-surface">
                <Text className="font-archivo-bold text-subjudul text-ink">
                  Lengkapi profil faskes
                </Text>

                <Text className="mt-2 mb-5 font-archivo text-caption text-ink-muted">
                  Profil dan lokasi diperlukan agar kebutuhan darah dapat
                  ditemukan oleh donor di sekitar fasilitas.
                </Text>

                <SetupField
                  label="Nama fasilitas *"
                  value={hospitalName}
                  onChangeText={setHospitalName}
                  placeholder="Contoh: RS Zaya"
                />

                <SetupField
                  label="Alamat *"
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Alamat lengkap fasilitas"
                />

                <Text className="mb-2 font-archivo-medium text-caption text-ink">
                  Lokasi fasilitas *
                </Text>

                <Pressable
                  onPress={onSelectSetupLocation}
                  disabled={locating}
                  className="flex-row items-center justify-center py-3 mb-4 border rounded-pill border-primary active:bg-primary-soft"
                >
                  {locating ? (
                    <ActivityIndicator color="#A31B0A" />
                  ) : (
                    <>
                      <MapPin color="#A31B0A" size={18} />

                      <Text className="ml-2 font-archivo-bold text-body text-primary-dark">
                        {facilityCoordinates
                          ? "Gunakan ulang lokasi perangkat"
                          : "Gunakan lokasi perangkat"}
                      </Text>
                    </>
                  )}
                </Pressable>

                {facilityCoordinates ? (
                  <View className="mb-5 overflow-hidden border rounded-[18px] border-line">
                    <MapView
                      key={facilityCoordinates.join(",")}
                      style={{ width: "100%", height: 220 }}
                      initialRegion={{
                        latitude: facilityCoordinates[1],
                        longitude: facilityCoordinates[0],
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      }}
                      onPress={(event) =>
                        setFacilityCoordinates([
                          event.nativeEvent.coordinate.longitude,
                          event.nativeEvent.coordinate.latitude,
                        ])
                      }
                    >
                      <Marker
                        draggable
                        coordinate={{
                          latitude: facilityCoordinates[1],
                          longitude: facilityCoordinates[0],
                        }}
                        onDragEnd={(event) =>
                          setFacilityCoordinates([
                            event.nativeEvent.coordinate.longitude,
                            event.nativeEvent.coordinate.latitude,
                          ])
                        }
                      />
                    </MapView>

                    <Text className="px-4 py-3 font-archivo text-caption text-ink-muted bg-surface">
                      Ketuk peta atau geser pin untuk menyesuaikan titik.
                    </Text>
                  </View>
                ) : (
                  <Text className="mb-5 font-archivo text-caption text-ink-muted">
                    Pilih lokasi agar fasilitas dapat ditemukan donor di dalam
                    radius.
                  </Text>
                )}

                <SetupField
                  label="Unit donor"
                  value={unitDonor}
                  onChangeText={setUnitDonor}
                  placeholder="Contoh: Unit Donor Darah"
                />

                <SetupField
                  label="Penanggung jawab"
                  value={picName}
                  onChangeText={setPicName}
                  placeholder="Nama penanggung jawab"
                />

                <SetupField
                  label="Kontak"
                  value={contact}
                  onChangeText={setContact}
                  placeholder="Nomor telepon fasilitas"
                />

                <SetupField
                  label="Jenis fasilitas"
                  value={hospitalType}
                  onChangeText={setHospitalType}
                  placeholder="Contoh: Rumah Sakit"
                />

                <Pressable
                  onPress={onSetupHospital}
                  disabled={locating || updateMutation.isPending}
                  className="items-center py-4 mt-5 rounded-pill bg-primary active:bg-primary-dark"
                >
                  {locating || updateMutation.isPending ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-archivo-bold text-body">
                      Simpan profil faskes
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={onLogout}
                  className="items-center py-3 mt-3 border rounded-pill border-primary active:bg-primary-soft"
                >
                  <Text className="font-archivo-bold text-body text-primary-dark">
                    Keluar
                  </Text>
                </Pressable>
              </View>
            ) : (
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
            )
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

                <Pressable
                  onPress={onUpdateLocation}
                  disabled={locating || updateMutation.isPending}
                  className="flex-row items-center justify-center py-3 mt-4 border rounded-pill border-primary active:bg-primary-soft"
                >
                  {locating || updateMutation.isPending ? (
                    <ActivityIndicator color="#A31B0A" />
                  ) : (
                    <>
                      <MapPin color="#A31B0A" size={18} />

                      <Text className="ml-2 font-archivo-bold text-body text-primary-dark">
                        Perbarui lokasi fasilitas
                      </Text>
                    </>
                  )}
                </Pressable>
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

function SetupField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 font-archivo-medium text-caption text-ink">
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9B9797"
        className="px-4 py-3 border rounded-card border-line bg-surface font-archivo text-body text-ink"
      />
    </View>
  );
}
