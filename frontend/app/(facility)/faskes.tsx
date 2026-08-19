import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  LogOut,
  MapPin,
  Pencil,
  ShieldCheck,
} from "lucide-react-native";
import {
  getMyHospital,
  updateMyHospital,
} from "../../src/api/hospitals";
import { errorMessage } from "../../src/lib/errorMessage";
import { useAuth } from "../../src/store/auth";

export default function FacilityProfile() {
  const logout = useAuth((state) => state.logout);
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hospitalName, setHospitalName] = useState("");
  const [address, setAddress] = useState("");
  const [unitDonor, setUnitDonor] = useState("");
  const [picName, setPicName] = useState("");
  const [contact, setContact] = useState("");
  const [hospitalType, setHospitalType] = useState("");

  const q = useQuery({
    queryKey: ["my-hospital"],
    queryFn: () => getMyHospital(),
  });

  const hospital = q.data;

  function startEditing() {
    if (!hospital) {
      return;
    }

    setHospitalName(hospital.hospital_name);
    setAddress(hospital.address ?? "");
    setUnitDonor(hospital.unit_donor ?? "");
    setPicName(hospital.pic_name ?? "");
    setContact(hospital.contact ?? "");
    setHospitalType(hospital.hospital_type ?? "");
    setEditing(true);
  }

  async function onSave() {
    const trimmedHospitalName = hospitalName.trim();

    if (!trimmedHospitalName) {
      Alert.alert(
        "Nama faskes wajib diisi",
        "Masukkan nama fasilitas kesehatan.",
      );
      return;
    }

    setSaving(true);

    try {
      await updateMyHospital({
        hospital_name: trimmedHospitalName,
        address: address.trim() || null,
        unit_donor: unitDonor.trim() || null,
        pic_name: picName.trim() || null,
        contact: contact.trim() || null,
        hospital_type: hospitalType.trim() || null,
      });

      await queryClient.invalidateQueries({
        queryKey: ["my-hospital"],
      });

      setEditing(false);
      Alert.alert("Tersimpan", "Profil fasilitas berhasil diperbarui.");
    } catch (error: any) {
      Alert.alert(
        "Gagal menyimpan profil",
        errorMessage(error, "Coba lagi atau periksa koneksi."),
      );
    } finally {
      setSaving(false);
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
          <View className="flex-row items-center justify-between pt-4">
            <Text className="font-archivo-bold text-judul text-ink">Faskes</Text>

            {hospital && !editing ? (
              <Pressable
                onPress={startEditing}
                className="flex-row items-center px-4 py-2 border rounded-pill border-line bg-surface active:bg-ground"
              >
                <Pencil color="#605D5D" size={16} />
                <Text className="ml-2 font-archivo-semibold text-caption text-ink">
                  Edit profil
                </Text>
              </Pressable>
            ) : null}
          </View>

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
              <View className="mt-6">
                <View className="flex-row items-center">
                  <View className="items-center justify-center w-16 h-16 mr-4 rounded-card bg-ink">
                    <Building2 color="#FFFFFF" size={30} />
                  </View>

                  <View className="flex-1">
                    <Text className="font-archivo-black text-judul text-ink">
                      {hospital.hospital_name}
                    </Text>

                    <View className="flex-row flex-wrap items-center mt-2 gap-2">
                      <View className="flex-row items-center px-3 py-1 rounded-pill bg-primary-soft">
                        <ShieldCheck color="#A31B0A" size={14} />

                        <Text className="ml-1 font-archivo-bold text-overline tracking-overline text-primary-dark">
                          {hospital.isVerified
                            ? "TERVERIFIKASI"
                            : "BELUM TERVERIFIKASI"}
                        </Text>
                      </View>

                      {hospital.code ? (
                        <View className="px-3 py-1 rounded-pill bg-surface border border-line">
                          <Text className="font-archivo-semibold text-caption text-ink-muted">
                            {hospital.code}
                          </Text>
                        </View>
                      ) : null}
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

              {editing ? (
                <View className="p-5 mt-5 border rounded-card border-line bg-surface">
                  <Text className="font-archivo-bold text-subjudul text-ink">
                    Edit profil faskes
                  </Text>

                  <Text className="mt-1 font-archivo text-caption text-ink-muted">
                    Kode fasilitas dan status verifikasi dikelola terpisah.
                  </Text>

                  <MetadataField
                    label="Nama fasilitas"
                    value={hospitalName}
                    onChangeText={setHospitalName}
                    placeholder="Masukkan nama fasilitas"
                  />

                  <MetadataField
                    label="Alamat"
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Masukkan alamat fasilitas"
                    multiline
                  />

                  <MetadataField
                    label="Unit donor"
                    value={unitDonor}
                    onChangeText={setUnitDonor}
                    placeholder="Masukkan nama unit donor"
                  />

                  <MetadataField
                    label="Penanggung jawab"
                    value={picName}
                    onChangeText={setPicName}
                    placeholder="Masukkan nama penanggung jawab"
                  />

                  <MetadataField
                    label="Kontak"
                    value={contact}
                    onChangeText={setContact}
                    placeholder="Masukkan nomor kontak"
                  />

                  <MetadataField
                    label="Tipe rumah sakit"
                    value={hospitalType}
                    onChangeText={setHospitalType}
                    placeholder="Masukkan tipe rumah sakit"
                  />

                  <View className="flex-row gap-3 mt-6">
                    <Pressable
                      onPress={() => setEditing(false)}
                      disabled={saving}
                      className="items-center flex-1 py-4 border rounded-pill border-line active:bg-ground"
                    >
                      <Text className="font-archivo-bold text-body text-ink">
                        Batal
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={onSave}
                      disabled={saving}
                      className={`items-center flex-1 py-4 rounded-pill ${
                        saving
                          ? "bg-primary-soft"
                          : "bg-primary active:bg-primary-dark"
                      }`}
                    >
                      {saving ? (
                        <ActivityIndicator color="#A31B0A" />
                      ) : (
                        <Text className="text-white font-archivo-bold text-body">
                          Simpan
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {/* Data fasilitas */}
              <Text className="mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
                DATA FASILITAS
              </Text>

              <View className="mt-3 overflow-hidden border rounded-card border-line bg-surface">
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
                <View className="flex-1 p-3 border rounded-card border-line bg-surface">
                  <Text className="font-archivo-black text-subjudul text-primary">
                    {hospital.stats.total_collected}
                  </Text>

                  <Text className="mt-1 font-archivo text-caption text-ink-muted">
                    Donasi terkumpul
                  </Text>
                </View>

                <View className="flex-1 p-3 border rounded-card border-line bg-surface">
                  <Text className="font-archivo-black text-subjudul text-ink">
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

function MetadataField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View className="mt-5">
      <Text className="mb-2 font-archivo-medium text-caption text-ink">
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9B9797"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        className={`px-4 py-3 border rounded-card border-line font-archivo text-body text-ink ${
          multiline ? "min-h-24" : ""
        }`}
      />
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
    <View
      className={`flex-row items-center justify-between px-4 py-4 ${
        last ? "" : "border-b border-line"
      }`}
    >
      <Text className="font-archivo text-caption text-ink-muted">{label}</Text>

      <Text className="ml-4 text-right font-archivo-semibold text-caption text-ink">
        {value || "-"}
      </Text>
    </View>
  );
}
