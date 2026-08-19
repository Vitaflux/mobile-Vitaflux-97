import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Location from "expo-location";
import { MapPin } from "lucide-react-native";
import { useAuth } from "../../src/store/auth";
import { errorMessage } from "../../src/lib/errorMessage";
import type { BloodType, Rhesus, Role } from "../../src/types/models";
import { registerPushTokenForCurrentDevice } from "../../src/lib/pushNotifications";

const BLOOD_TYPES: BloodType[] = ["A", "B", "AB", "O"];

export default function GoogleOnboarding() {
  const pending = useAuth((state) => state.googleOnboarding);
  const complete = useAuth((state) => state.completeGoogleOnboarding);
  const [role, setRole] = useState<Role>("donor");
  const [facilityName, setFacilityName] = useState("");
  const [address, setAddress] = useState("");
  const [bloodType, setBloodType] = useState<BloodType>("A");
  const [rhesus, setRhesus] = useState<Rhesus>("+");
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const donor = role === "donor";

  async function selectLocation() {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Izin lokasi diperlukan",
          "Izinkan lokasi untuk melanjutkan.",
        );
        return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCoordinates([current.coords.longitude, current.coords.latitude]);
    } catch (error) {
      Alert.alert(
        "Lokasi gagal diambil",
        errorMessage(error, "Aktifkan GPS lalu coba lagi."),
      );
    } finally {
      setLocating(false);
    }
  }

  async function onSubmit() {
    if (!pending) {
      Alert.alert("Sesi berakhir", "Silakan login kembali dengan Google.");
      router.replace("/(auth)/login");
      return;
    }
    if (!coordinates) {
      Alert.alert(
        "Lokasi belum ada",
        "Gunakan lokasi saat ini terlebih dahulu.",
      );
      return;
    }
    if (!donor && (!facilityName.trim() || !address.trim())) {
      Alert.alert("Lengkapi data", "Nama dan alamat fasilitas wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      await complete({
        role,
        location: { type: "Point", coordinates },
        ...(donor
          ? { blood_type: bloodType, rhesus }
          : { name: facilityName.trim(), address: address.trim() }),
      });
      const user = useAuth.getState().user;
      if (!user) throw new Error("Data pengguna tidak ditemukan.");
      if (user.role === "donor") {
        try {
          await registerPushTokenForCurrentDevice();
        } catch (pushError) {
          console.warn("Push token belum dapat didaftarkan:", pushError);
        }
      }
      router.replace(user.role === "facility" ? "/(facility)" : "/(donor)");
    } catch (error) {
      Alert.alert(
        "Pendaftaran gagal",
        errorMessage(error, "Silakan coba lagi."),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerClassName="px-6 pb-8"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="mt-6 font-archivo-bold text-judul text-ink">
            Lengkapi akun Google
          </Text>
          <Text className="mb-6 mt-2 font-archivo text-body text-ink-muted">
            {pending
              ? `${pending.name} · ${pending.email}`
              : "Sesi Google tidak ditemukan"}
          </Text>

          <Text className="mb-2 font-archivo-medium text-caption text-ink">
            Bergabung sebagai
          </Text>
          <View className="mb-6 flex-row gap-2">
            {(["donor", "facility"] as Role[]).map((item) => (
              <Pressable
                key={item}
                onPress={() => setRole(item)}
                className={`flex-1 items-center rounded-pill border py-4 ${role === item ? "border-primary bg-primary" : "border-line"}`}
              >
                <Text
                  className={`font-archivo-semibold ${role === item ? "text-white" : "text-ink"}`}
                >
                  {item === "donor" ? "Pendonor" : "Fasilitas"}
                </Text>
              </Pressable>
            ))}
          </View>

          {donor ? (
            <>
              <Text className="mb-2 font-archivo-medium text-caption text-ink">
                Golongan darah
              </Text>
              <View className="mb-4 flex-row gap-2">
                {BLOOD_TYPES.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setBloodType(item)}
                    className={`flex-1 items-center rounded-pill border py-3 ${bloodType === item ? "border-primary bg-primary" : "border-line"}`}
                  >
                    <Text
                      className={`font-archivo-bold ${bloodType === item ? "text-white" : "text-ink"}`}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View className="mb-6 flex-row gap-2">
                {(["+", "-"] as Rhesus[]).map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setRhesus(item)}
                    className={`flex-1 items-center rounded-pill border py-3 ${rhesus === item ? "border-primary bg-primary" : "border-line"}`}
                  >
                    <Text
                      className={`font-archivo-bold ${rhesus === item ? "text-white" : "text-ink"}`}
                    >
                      Rhesus {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text className="mb-2 font-archivo-medium text-caption text-ink">
                Nama fasilitas
              </Text>
              <TextInput
                value={facilityName}
                onChangeText={setFacilityName}
                placeholder="Contoh: PMI Kota Bandung"
                className="mb-5 rounded-card border border-line px-4 py-4"
              />
              <Text className="mb-2 font-archivo-medium text-caption text-ink">
                Alamat fasilitas
              </Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Alamat lengkap"
                multiline
                className="mb-5 min-h-24 rounded-card border border-line px-4 py-4"
              />
            </>
          )}

          <Pressable
            onPress={selectLocation}
            disabled={locating}
            className={`mb-6 flex-row items-center justify-center rounded-pill border py-4 ${coordinates ? "border-primary bg-primary-soft" : "border-line"}`}
          >
            {locating ? (
              <ActivityIndicator color="#EC3013" />
            ) : (
              <>
                <MapPin color="#EC3013" size={18} />
                <Text className="ml-2 font-archivo-semibold text-primary-dark">
                  {coordinates
                    ? "Lokasi berhasil dipilih"
                    : "Gunakan lokasi saat ini"}
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={onSubmit}
            disabled={loading || !pending}
            className="items-center rounded-pill bg-primary py-4"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-archivo-bold text-white">
                Simpan dan lanjutkan
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
