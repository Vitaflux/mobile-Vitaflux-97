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
};

export default function Scan() {
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();

  const [screen, setScreen] = useState<ScreenState>("capture");

  const [mode, setMode] = useState<"camera" | "manual">("camera");

  const [torchEnabled, setTorchEnabled] = useState(false);

  const [scannerLocked, setScannerLocked] = useState(false);

  const [manualCode, setManualCode] = useState("");

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

  async function onConfirmCheckIn(volumeMl: number) {
    if (!pendingInput || processing) {
      return;
    }

    setProcessing(true);

    try {
      const response =
        pendingInput.type === "qr"
          ? await checkInRequest({
              qr_token: pendingInput.value,
              volume_ml: volumeMl,
            })
          : await checkInRequest({
              code: pendingInput.value,
              volume_ml: volumeMl,
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
    setPendingInput(null);
    setResult(null);
    setFailureTitle("Check-in gagal");
    setFailureMessage("");
  }

  if (screen === "confirm") {
    return (
      <ConfirmationScreen
        pendingInput={pendingInput}
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
          <ScannerFrame />

          <Text className="px-10 mt-6 text-center text-white font-archivo-bold text-body">
            Arahkan kamera ke QR pendonor
          </Text>

          <Text className="px-10 mt-2 text-center text-white/70 font-archivo text-caption">
            Jaga QR tetap di dalam bingkai dan beri jarak sekitar 20 cm.
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
            className="flex-row items-center justify-center py-4 rounded-pill bg-primary active:bg-primary-dark"
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
  processing,
  onConfirm,
  onCancel,
}: {
  pendingInput: InputMethod | null;
  processing: boolean;
  onConfirm: (volumeMl: number) => void;
  onCancel: () => void;
}) {
  const [volumeInput, setVolumeInput] = useState("");
  const volumeMl = Number(volumeInput);
  const volumeValid =
    volumeInput.length > 0 && Number.isInteger(volumeMl) && volumeMl > 0;
  const displayValue =
    pendingInput?.type === "code"
      ? pendingInput.value
      : "QR pendonor berhasil dibaca";

  return (
    <View className="flex-1 bg-ink">
      <StatusBar style="light" />

      <View className="items-center justify-center flex-1 opacity-60">
        <ScannerFrame subdued />
      </View>

      <SafeAreaView
        edges={["bottom"]}
        className="px-6 pt-3 rounded-t-sheet bg-surface"
      >
        <View className="self-center w-12 h-1 rounded-pill bg-line" />

        <View className="flex-row items-center mt-4">
          <View className="items-center justify-center w-8 h-8 rounded-pill bg-ink">
            <QrCode color="#FFFFFF" size={17} />
          </View>

          <Text className="ml-3 font-archivo-bold text-body text-ink">
            QR terbaca
          </Text>

          <View className="px-3 py-1 ml-auto rounded-pill bg-ink">
            <Text className="text-white font-archivo-bold text-overline tracking-overline">
              DIKONFIRMASI
            </Text>
          </View>
        </View>

        <View className="w-full p-5 mt-4 border rounded-[18px] border-line bg-surface">
          <Text className="font-archivo-bold text-subjudul text-ink">
            Konfirmasi check-in
          </Text>

          <Text className="mt-1 font-archivo text-caption text-ink-muted">
            {displayValue}
          </Text>

          <Text className="mt-5 mb-2 font-archivo-medium text-caption text-ink">
            Volume darah aktual
          </Text>

          <View className="flex-row items-center">
            <TextInput
              value={volumeInput}
              onChangeText={(value) => setVolumeInput(value.replace(/\D/g, ""))}
              placeholder="Masukkan volume"
              placeholderTextColor="#9B9797"
              keyboardType="numeric"
              className="flex-1 px-4 py-[14px] border rounded-card border-line bg-ground font-archivo text-body text-ink"
            />

            <Text className="ml-3 font-archivo-semibold text-body text-ink-muted">
              ml
            </Text>
          </View>

          {volumeInput.length > 0 && !volumeValid ? (
            <Text className="mt-2 font-archivo text-caption text-primary-dark">
              Volume harus lebih dari 0 ml.
            </Text>
          ) : null}
        </View>

        <Text className="mt-3 font-archivo text-caption text-ink-muted">
          Konfirmasi hanya setelah donasi benar-benar selesai.
        </Text>

        <View className="flex-row gap-3 pt-4 pb-2">
          <Pressable
            onPress={onCancel}
            disabled={processing}
            className="items-center px-6 py-4 border rounded-pill border-line bg-surface"
          >
            <Text className="font-archivo-semibold text-body text-ink">
              Batal
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onConfirm(volumeMl)}
            disabled={processing || !volumeValid}
            className={`flex-1 items-center py-4 rounded-pill ${
              volumeValid && !processing
                ? "bg-primary active:bg-primary-dark"
                : "bg-primary/50"
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
        </View>
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
    <View className="flex-1 bg-surface">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1">
        <View className="flex-1 px-7 pt-7">
          <View className="items-center justify-center w-20 h-20 rounded-sheet bg-primary">
            <CheckCircle2 color="#FFFFFF" size={44} />
          </View>

          <Text className="mt-6 font-archivo-black text-display text-ink">
            Check-in berhasil
          </Text>

          <Text className="mt-2 font-archivo text-body text-ink-muted">
            Status donor kini Selesai. Donasi sudah masuk ke riwayat pendonor.
          </Text>

          <View className="w-full mt-6 overflow-hidden border rounded-[18px] border-line bg-surface">
            <View className="px-5 py-4 border-b border-line">
              <View className="self-start px-3 py-1 rounded-pill bg-ink">
                <Text className="text-white font-archivo-bold text-overline tracking-overline">
                  SELESAI
                </Text>
              </View>
            </View>

            <View className="p-5">
              <InfoRow label="Kode" value={result?.code || "-"} />

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
          </View>
        </View>

        <View className="px-7 pt-3 pb-2 border-t border-line bg-surface">
          <Pressable
            onPress={onNext}
            className="items-center w-full py-4 rounded-pill bg-primary active:bg-primary-dark"
          >
            <Text className="text-white font-archivo-bold text-body">
              Scan berikutnya
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/(facility)")}
            className="items-center w-full py-4 mt-3 border rounded-pill border-ink bg-surface"
          >
            <Text className="font-archivo-semibold text-body text-ink">
              Kembali ke Dashboard
            </Text>
          </Pressable>
        </View>
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
    <View className="flex-1 bg-ink">
      <StatusBar style="light" />

      <View className="items-center justify-center flex-1 opacity-30">
        <ScannerFrame subdued />
      </View>

      <SafeAreaView
        edges={["bottom"]}
        className="px-6 pt-3 rounded-t-sheet bg-surface"
      >
        <View className="self-center w-12 h-1 rounded-pill bg-line" />

        <View className="flex-row items-center mt-4">
          <View className="items-center justify-center w-10 h-10 rounded-pill bg-primary-soft">
            <TriangleAlert color="#A31B0A" size={21} />
          </View>

          <Text className="flex-1 ml-3 font-archivo-black text-subjudul text-ink">
            {title}
          </Text>
        </View>

        <View className="p-4 mt-4 border rounded-card border-line bg-ground">
          <Text className="font-archivo text-caption text-ink-muted">
            {message}
          </Text>
        </View>

        <View className="flex-row gap-3 pt-4 pb-2">
          <Pressable
            onPress={onManual}
            className="flex-row items-center justify-center px-5 py-4 border rounded-pill border-line bg-surface"
          >
            <Keyboard color="#201E1D" size={18} />

            <Text className="ml-2 font-archivo-semibold text-body text-ink">
              Kode
            </Text>
          </Pressable>

          <Pressable
            onPress={onRetry}
            className="items-center flex-1 py-4 rounded-pill bg-primary active:bg-primary-dark"
          >
            <Text className="text-white font-archivo-bold text-body">
              Scan ulang
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function ScannerFrame({ subdued = false }: { subdued?: boolean }) {
  const borderColor = subdued ? "border-line" : "border-primary";
  const lineColor = subdued ? "bg-line" : "bg-primary";

  return (
    <View className="relative w-64 h-64">
      <View
        className={`absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 rounded-tl-sheet ${borderColor}`}
      />
      <View
        className={`absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 rounded-tr-sheet ${borderColor}`}
      />
      <View
        className={`absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 rounded-bl-sheet ${borderColor}`}
      />
      <View
        className={`absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 rounded-br-sheet ${borderColor}`}
      />
      <View className={`absolute left-3 right-3 h-0.5 top-1/2 ${lineColor}`} />
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
