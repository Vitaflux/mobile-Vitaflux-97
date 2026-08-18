import { useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { checkInByQr } from "../../src/api/requests";
import { errorMessage } from "../../src/lib/errorMessage";

export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  async function onBarcode({ data }: { data: string }) {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);
    try {
      await checkInByQr(data);
      Alert.alert("Check-in berhasil", "Status pendonor menjadi Selesai.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert(
        "Check-in gagal",
        errorMessage(e, "QR tidak valid atau sudah digunakan."),
        [{ text: "Scan lagi", onPress: () => setScanned(false) }],
      );
    } finally {
      setProcessing(false);
    }
  }

  // Izin belum siap
  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-ground">
        <ActivityIndicator color="#EC3013" />
      </View>
    );
  }

  // Izin belum diberikan
  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-ground px-6">
        <Text className="text-center font-archivo-bold text-body text-ink">
          Butuh izin kamera
        </Text>
        <Text className="mt-2 text-center font-archivo text-caption text-ink-muted">
          Kamera dipakai untuk memindai QR check-in pendonor.
        </Text>
        <Pressable
          onPress={requestPermission}
          className="mt-5 items-center rounded-pill bg-primary px-6 py-3 active:bg-primary-dark"
        >
          <Text className="font-archivo-bold text-body text-white">
            Izinkan kamera
          </Text>
        </Pressable>
        <Pressable onPress={() => router.back()} className="mt-3 px-6 py-2">
          <Text className="font-archivo-semibold text-body text-ink-muted">
            Kembali
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-ink">
      <StatusBar style="light" />
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : onBarcode}
      />

      {/* Overlay */}
      <SafeAreaView className="absolute inset-0">
        <View className="flex-row items-center px-6 pt-3">
          <Pressable onPress={() => router.back()} hitSlop={8} className="mr-3">
            <Text className="text-2xl text-white">←</Text>
          </Pressable>
          <Text className="font-archivo-semibold text-body text-white">
            Scan QR pendonor
          </Text>
        </View>

        <View className="flex-1 items-center justify-center">
          <View className="h-64 w-64 rounded-[22px] border-2 border-white/80" />
          <Text className="mt-6 px-10 text-center font-archivo text-caption text-white">
            {processing
              ? "Memproses check-in..."
              : "Arahkan kamera ke QR pendonor untuk check-in."}
          </Text>
          {processing && (
            <ActivityIndicator color="#fff" className="mt-3" />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
