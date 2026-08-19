import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  Camera,
  CheckCircle2,
  Flashlight,
  Keyboard,
  QrCode,
  TriangleAlert,
} from "lucide-react-native";
import { checkInRequest } from "../../src/api/requests";
import { errorMessage } from "../../src/lib/errorMessage";

type InputMethod =
  | {
      type: "qr";
      value: string;
    }
  | {
      type: "code";
      value: string;
    };

type ScreenState = "capture" | "confirm" | "success" | "error";

type CheckInResult = {
  id: string;
  status: "done";
  code?: string | null;
  checked_in_at?: string | null;
  volume_ml?: number | null;
};

export default function Scan() {
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();

  const [screen, setScreen] = useState<ScreenState>("capture");

  const [mode, setMode] = useState<"camera" | "manual">("camera");

  const [torchEnabled, setTorchEnabled] = useState(false);

  const [scannerLocked, setScannerLocked] = useState(false);

  const [manualCode, setManualCode] = useState("");

  const [volumeMl, setVolumeMl] = useState("");

  const [pendingInput, setPendingInput] = useState<InputMethod | null>(null);

  const [processing, setProcessing] = useState(false);

  const [result, setResult] = useState<CheckInResult | null>(null);

  const [failureTitle, setFailureTitle] = useState("Check-in gagal");

  const [failureMessage, setFailureMessage] = useState("");

  const manualCodeValid = /^VF-\d{4}$/.test(manualCode.trim().toUpperCase());

  function onBarcodeScanned({ data }: { data: string }) {
    if (scannerLocked || processing) {
      return;
    }

    setScannerLocked(true);

    setPendingInput({
      type: "qr",
      value: data,
    });

    setScreen("confirm");
  }

  function onManualSubmit() {
    const normalizedCode = manualCode.trim().toUpperCase();

    if (!/^VF-\d{4}$/.test(normalizedCode)) {
      setFailureTitle("Format kode salah");
      setFailureMessage("Masukkan kode dengan format VF-8241.");
      setScreen("error");

      return;
    }

    setPendingInput({
      type: "code",
      value: normalizedCode,
    });

    setScreen("confirm");
  }

  async function onConfirmCheckIn() {
    if (!pendingInput || processing) {
      return;
    }

    const parsedVolume = Number(volumeMl);

    if (
      !Number.isInteger(parsedVolume) ||
      parsedVolume < 1 ||
      parsedVolume > 2000
    ) {
      setFailureTitle("Volume belum sesuai");
      setFailureMessage("Masukkan volume darah antara 1–2000 ml.");
      setScreen("error");
      return;
    }

    setProcessing(true);

    try {
      const response =
        pendingInput.type === "qr"
          ? await checkInRequest({
              qr_token: pendingInput.value,
              volume_ml: parsedVolume,
            })
          : await checkInRequest({
              code: pendingInput.value,
              volume_ml: parsedVolume,
            });

      setResult(response as unknown as CheckInResult);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["facility-bloods"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["applicants"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["my-requests"],
        }),
      ]);

      setScreen("success");
    } catch (error: any) {
      const message = errorMessage(
        error,
        "QR atau kode tidak dapat digunakan.",
      );

      const normalizedMessage = message.toLowerCase();

      if (
        normalizedMessage.includes("expired") ||
        normalizedMessage.includes("kadaluarsa")
      ) {
        setFailureTitle("QR kadaluarsa");
        setFailureMessage(
          "Jadwal kebutuhan sudah berakhir. QR tidak dapat digunakan lagi.",
        );
      } else if (
        normalizedMessage.includes("not found") ||
        normalizedMessage.includes("tidak ditemukan")
      ) {
        setFailureTitle("Tidak terdaftar");
        setFailureMessage("QR atau kode ini tidak terdaftar pada fasilitasmu.");
      } else if (
        normalizedMessage.includes("has not started") ||
        normalizedMessage.includes("belum dimulai")
      ) {
        setFailureTitle("Jadwal belum dimulai");
        setFailureMessage(
          "QR baru dapat digunakan setelah jadwal donor dimulai.",
        );
      } else if (normalizedMessage.includes("cannot transition")) {
        setFailureTitle("Status tidak dapat diproses");
        setFailureMessage("Pendaftaran belum dikonfirmasi atau sudah selesai.");
      } else {
        setFailureTitle("Check-in gagal");
        setFailureMessage(message);
      }

      setScreen("error");
    } finally {
      setProcessing(false);
    }
  }

  function resetScanner() {
    setScreen("capture");
    setMode("camera");
    setTorchEnabled(false);
    setScannerLocked(false);
    setManualCode("");
    setVolumeMl("");
    setPendingInput(null);
    setResult(null);
    setFailureTitle("Check-in gagal");
    setFailureMessage("");
  }

  if (screen === "confirm") {
    return (
      <ConfirmationScreen
        pendingInput={pendingInput}
        volumeMl={volumeMl}
        onVolumeChange={setVolumeMl}
        processing={processing}
        onConfirm={onConfirmCheckIn}
        onCancel={resetScanner}
      />
    );
  }

  if (screen === "success") {
    return <SuccessScreen result={result} onNext={resetScanner} />;
  }

  if (screen === "error") {
    return (
      <ErrorScreen
        title={failureTitle}
        message={failureMessage}
        onRetry={resetScanner}
        onManual={() => {
          setScreen("capture");
          setMode("manual");
          setScannerLocked(false);
          setPendingInput(null);
        }}
      />
    );
  }

  if (mode === "manual") {
    return (
      <ManualCodeScreen
        code={manualCode}
        valid={manualCodeValid}
        onChange={setManualCode}
        onSubmit={onManualSubmit}
        onCamera={() => {
          setMode("camera");
          setScannerLocked(false);
        }}
      />
    );
  }

  if (!permission) {
    return (
      <View className="items-center justify-center flex-1 bg-ground">
        <ActivityIndicator color="#EC3013" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="items-center justify-center flex-1 px-6 bg-ground">
        <Camera color="#EC3013" size={44} />

        <Text className="mt-5 text-center font-archivo-bold text-subjudul text-ink">
          Butuh izin kamera
        </Text>

        <Text className="mt-2 text-center font-archivo text-caption text-ink-muted">
          Kamera digunakan untuk memindai QR check-in pendonor.
        </Text>

        <Pressable
          onPress={requestPermission}
          className="items-center w-full py-4 mt-6 rounded-pill bg-primary active:bg-primary-dark"
        >
          <Text className="text-white font-archivo-bold text-body">
            Izinkan kamera
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setMode("manual")}
          className="items-center w-full py-4 mt-3 border rounded-pill border-line bg-surface"
        >
          <Text className="font-archivo-semibold text-body text-ink">
            Masukkan kode manual
          </Text>
        </Pressable>

        <Pressable onPress={() => router.back()} className="px-6 py-3 mt-2">
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
        style={{
          flex: 1,
        }}
        enableTorch={torchEnabled}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scannerLocked ? undefined : onBarcodeScanned}
      />

      <SafeAreaView className="absolute inset-0">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-3">
          <View className="flex-row items-center flex-1">
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              className="mr-3"
            >
              <Text className="text-2xl text-white">←</Text>
            </Pressable>

            <Text className="text-white font-archivo-semibold text-body">
              Scan QR pendonor
            </Text>
          </View>

          <Pressable
            onPress={() => setTorchEnabled((current) => !current)}
            className={`h-11 w-11 items-center justify-center rounded-pill ${
              torchEnabled ? "bg-primary" : "bg-black/40"
            }`}
          >
            <Flashlight color="#FFFFFF" size={22} />
          </Pressable>
        </View>

        {/* Scanner frame */}
        <View className="items-center justify-center flex-1">
          <View className="h-64 w-64 rounded-[22px] border-2 border-white" />

          <Text className="px-10 mt-6 text-center text-white font-archivo text-caption">
            Arahkan kamera ke QR pendonor.
          </Text>
        </View>

        {/* Manual input */}
        <View className="px-6 pb-6">
          <Pressable
            onPress={() => {
              setMode("manual");
              setTorchEnabled(false);
              setScannerLocked(false);
            }}
            className="flex-row items-center justify-center py-4 border rounded-pill border-white/60 bg-black/40"
          >
            <Keyboard color="#FFFFFF" size={20} />

            <Text className="ml-2 text-white font-archivo-bold text-body">
              Masukkan kode manual
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function ManualCodeScreen({
  code,
  valid,
  onChange,
  onSubmit,
  onCamera,
}: {
  code: string;
  valid: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCamera: () => void;
}) {
  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1 px-6">
        <View className="flex-row items-center h-12">
          <Pressable onPress={() => router.back()} hitSlop={8} className="mr-3">
            <Text className="text-2xl text-ink">←</Text>
          </Pressable>

          <Text className="font-archivo-semibold text-body text-ink">
            Kode check-in
          </Text>
        </View>

        <View className="justify-center flex-1">
          <View className="items-center">
            <QrCode color="#EC3013" size={48} />

            <Text className="mt-5 text-center font-archivo-bold text-subjudul text-ink">
              Masukkan kode pendonor
            </Text>

            <Text className="mt-2 text-center font-archivo text-caption text-ink-muted">
              Kode terdiri dari VF- diikuti empat angka.
            </Text>
          </View>

          <TextInput
            value={code}
            onChangeText={(value) => onChange(value.toUpperCase())}
            placeholder="VF-8241"
            placeholderTextColor="#9B9797"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={7}
            className="px-4 py-4 mt-6 text-center border rounded-card border-line bg-surface font-archivo-bold text-subjudul text-ink"
          />

          <Pressable
            onPress={onSubmit}
            disabled={!valid}
            className={`items-center py-4 mt-4 rounded-pill ${
              valid ? "bg-primary active:bg-primary-dark" : "bg-primary/50"
            }`}
          >
            <Text className="text-white font-archivo-bold text-body">
              Lanjutkan
            </Text>
          </Pressable>

          <Pressable
            onPress={onCamera}
            className="flex-row items-center justify-center py-4 mt-3 border rounded-pill border-line bg-surface"
          >
            <Camera color="#201E1D" size={20} />

            <Text className="ml-2 font-archivo-semibold text-body text-ink">
              Gunakan kamera
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function ConfirmationScreen({
  pendingInput,
  volumeMl,
  onVolumeChange,
  processing,
  onConfirm,
  onCancel,
}: {
  pendingInput: InputMethod | null;
  volumeMl: string;
  onVolumeChange: (value: string) => void;
  processing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const displayValue =
    pendingInput?.type === "code"
      ? pendingInput.value
      : "QR pendonor berhasil dibaca";
  const parsedVolume = Number(volumeMl);
  const volumeValid =
    Number.isInteger(parsedVolume) && parsedVolume >= 1 && parsedVolume <= 2000;

  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />

      <SafeAreaView className="items-center justify-center flex-1 px-6">
        <View className="items-center justify-center w-20 h-20 rounded-pill bg-primary-soft">
          <QrCode color="#A31B0A" size={38} />
        </View>

        <Text className="mt-6 text-center font-archivo-bold text-judul text-ink">
          QR terbaca
        </Text>

        <Text className="mt-2 text-center font-archivo text-body text-ink-muted">
          {displayValue}
        </Text>

        <View className="w-full p-5 mt-6 border rounded-card border-line bg-surface">
          <Text className="font-archivo-bold text-body text-ink">
            Konfirmasi check-in
          </Text>

          <Text className="mt-1 font-archivo text-caption text-ink-muted">
            Setelah dikonfirmasi, status donor akan berubah menjadi Selesai.
          </Text>

          <Text className="mt-5 font-archivo-semibold text-caption text-ink">
            Volume darah (ml)
          </Text>

          <TextInput
            value={volumeMl}
            onChangeText={(value) =>
              onVolumeChange(value.replace(/[^0-9]/g, ""))
            }
            placeholder="Contoh: 350"
            placeholderTextColor="#9B9797"
            keyboardType="number-pad"
            maxLength={4}
            className="px-4 py-4 mt-2 border rounded-card border-line bg-ground font-archivo-bold text-body text-ink"
          />

          <View className="flex-row mt-3 gap-x-2">
            {[250, 350, 450].map((amount) => (
              <Pressable
                key={amount}
                onPress={() => onVolumeChange(String(amount))}
                className={`flex-1 items-center rounded-pill border py-2 ${
                  volumeMl === String(amount)
                    ? "border-primary bg-primary-soft"
                    : "border-line bg-surface"
                }`}
              >
                <Text className="font-archivo-semibold text-caption text-ink">
                  {amount} ml
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          onPress={onConfirm}
          disabled={processing || !volumeValid}
          className={`items-center w-full py-4 mt-6 rounded-pill ${
            volumeValid ? "bg-primary active:bg-primary-dark" : "bg-primary/50"
          }`}
        >
          {processing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-archivo-bold text-body">
              Tandai selesai
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={onCancel}
          disabled={processing}
          className="items-center w-full py-4 mt-3 border rounded-pill border-line bg-surface"
        >
          <Text className="font-archivo-semibold text-body text-ink">
            Batal
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

function SuccessScreen({
  result,
  onNext,
}: {
  result: CheckInResult | null;
  onNext: () => void;
}) {
  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />

      <SafeAreaView className="items-center justify-center flex-1 px-6">
        <View className="items-center justify-center w-24 h-24 rounded-pill bg-primary">
          <CheckCircle2 color="#FFFFFF" size={52} />
        </View>

        <Text className="mt-6 text-center font-archivo-bold text-judul text-ink">
          Check-in berhasil
        </Text>

        <Text className="mt-2 text-center font-archivo text-body text-ink-muted">
          Status donor sudah berubah menjadi Selesai.
        </Text>

        <View className="w-full p-5 mt-6 border rounded-card border-line bg-surface">
          <InfoRow label="Status" value="Selesai" />

          <InfoRow label="Kode" value={result?.code || "-"} />

          <InfoRow
            label="Volume"
            value={result?.volume_ml ? `${result.volume_ml} ml` : "-"}
          />

          <InfoRow
            label="Waktu check-in"
            value={
              result?.checked_in_at
                ? new Date(result.checked_in_at).toLocaleString("id-ID")
                : "-"
            }
            last
          />
        </View>

        <Pressable
          onPress={onNext}
          className="items-center w-full py-4 mt-6 rounded-pill bg-primary active:bg-primary-dark"
        >
          <Text className="text-white font-archivo-bold text-body">
            Scan berikutnya
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/(facility)")}
          className="items-center w-full py-4 mt-3 border rounded-pill border-line bg-surface"
        >
          <Text className="font-archivo-semibold text-body text-ink">
            Kembali ke Dashboard
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

function ErrorScreen({
  title,
  message,
  onRetry,
  onManual,
}: {
  title: string;
  message: string;
  onRetry: () => void;
  onManual: () => void;
}) {
  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />

      <SafeAreaView className="items-center justify-center flex-1 px-6">
        <View className="items-center justify-center w-24 h-24 rounded-pill bg-primary-soft">
          <TriangleAlert color="#A31B0A" size={48} />
        </View>

        <Text className="mt-6 text-center font-archivo-bold text-judul text-ink">
          {title}
        </Text>

        <Text className="mt-2 text-center font-archivo text-body text-ink-muted">
          {message}
        </Text>

        <Pressable
          onPress={onRetry}
          className="items-center w-full py-4 mt-6 rounded-pill bg-primary active:bg-primary-dark"
        >
          <Text className="text-white font-archivo-bold text-body">
            Scan lagi
          </Text>
        </Pressable>

        <Pressable
          onPress={onManual}
          className="flex-row items-center justify-center w-full py-4 mt-3 border rounded-pill border-line bg-surface"
        >
          <Keyboard color="#201E1D" size={20} />

          <Text className="ml-2 font-archivo-semibold text-body text-ink">
            Gunakan kode manual
          </Text>
        </Pressable>
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
    <View className={last ? "" : "pb-4 mb-4 border-b border-line"}>
      <Text className="font-archivo text-caption text-ink-muted">{label}</Text>

      <Text className="mt-1 font-archivo-semibold text-body text-ink">
        {value}
      </Text>
    </View>
  );
}
