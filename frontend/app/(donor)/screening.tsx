import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { registerToBlood } from "../../src/api/requests";
import { errorMessage } from "../../src/lib/errorMessage";

const QS = [
  {
    key: "usia_17_65",
    text: "Usia kamu 17–65 tahun?",
    hint: "Batas usia pendonor sukarela.",
    good: "Ya",
  },
  {
    key: "sehat_hari_ini",
    text: "Dalam kondisi sehat hari ini?",
    hint: "Tidak demam, batuk, atau flu.",
    good: "Ya",
  },
  {
    key: "tidur_cukup",
    text: "Tidur minimal 5 jam semalam?",
    hint: "Kurang tidur menaikkan risiko pingsan.",
    good: "Ya",
  },
  {
    key: "antibiotik",
    text: "Sedang mengonsumsi antibiotik?",
    hint: "Termasuk obat yang diresepkan minggu ini.",
    good: "Tidak",
  },
  {
    key: "jeda_60_hari",
    text: "Donor terakhir lebih dari 60 hari lalu?",
    hint: "Interval minimum antar donor whole blood.",
    good: "Ya",
  },
] as const;

type FormValues = {
  weight: string;
  usia_17_65: string;
  sehat_hari_ini: string;
  tidur_cukup: string;
  antibiotik: string;
  jeda_60_hari: string;
};

export default function Screening() {
  const params = useLocalSearchParams<{ data?: string }>();

  const { control, watch } = useForm<FormValues>({
    defaultValues: {
      weight: "",
      usia_17_65: "",
      sehat_hari_ini: "",
      tidur_cukup: "",
      antibiotik: "",
      jeda_60_hari: "",
    },
  });

  const [submitting, setSubmitting] = useState(false);

  const v = watch();
  const weightNum = Number(v.weight);
  const weightAnswered = v.weight.trim() !== "" && !isNaN(weightNum);
  const weightOk = weightAnswered && weightNum >= 45;

  const answeredCount =
    (weightAnswered ? 1 : 0) + QS.filter((q) => v[q.key]).length;
  const total = QS.length + 1;
  const allAnswered = answeredCount === total;
  const allGood = weightOk && QS.every((q) => v[q.key] === q.good);
  const pass = allAnswered && allGood;

  const elig = !allAnswered
    ? {
        title: "Lengkapi jawabanmu",
        body: "Jawab semua pertanyaan untuk melihat hasil.",
        ok: false,
      }
    : pass
    ? {
        title: "Kamu memenuhi syarat awal",
        body: "Petugas tetap memeriksa ulang di lokasi.",
        ok: true,
      }
    : {
        title: "Sebaiknya tunda dulu",
        body: "Ada jawaban yang belum memenuhi syarat. Cek lagi atau tunda donor.",
        ok: false,
      };

  async function onLanjut() {
    if (!pass || submitting) return;

    let bloodsId: string | undefined;
    try {
      const parsed = params.data ? JSON.parse(params.data) : null;
      bloodsId = parsed?.id;
    } catch {
      bloodsId = undefined;
    }
    if (!bloodsId) {
      Alert.alert("Data kurang", "Kebutuhan tidak dikenali. Kembali dan pilih ulang.");
      return;
    }

    const screeningAnswers = {
      weight_kg: weightNum,
      ...Object.fromEntries(QS.map((q) => [q.key, v[q.key]])),
    };

    setSubmitting(true);
    try {
      const created = await registerToBlood(bloodsId, screeningAnswers);
      router.replace({
        pathname: "/(donor)/status",
        params: { req: JSON.stringify(created), data: params.data },
      });
    } catch (e: any) {
      Alert.alert("Gagal daftar", errorMessage(e, "Coba lagi atau periksa koneksi."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-ground">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerClassName="px-6 pb-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="h-12 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Pressable onPress={() => router.back()} hitSlop={8} className="mr-3">
                <Text className="text-2xl text-ink">←</Text>
              </Pressable>
              <Text className="font-archivo-semibold text-body text-ink">
                Skrining kesehatan
              </Text>
            </View>
            <Text className="font-archivo-bold text-caption text-ink-muted">
              {answeredCount}/{total}
            </Text>
          </View>

          <Text className="mt-2 font-archivo text-body text-ink-muted">
            Jawab jujur ya — ini hanya penyaringan awal. Petugas tetap memeriksa
            ulang di lokasi.
          </Text>

          {/* Berat badan */}
          <Text className="mb-2 mt-6 font-archivo-medium text-caption text-ink">
            Berat badan (kg)
          </Text>
          <Controller
            control={control}
            name="weight"
            render={({ field: { value, onChange } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                placeholder="mis. 60"
                placeholderTextColor="#9b9797"
                className="rounded-card border border-line px-4 py-[14px] font-archivo text-body text-ink"
              />
            )}
          />
          {weightAnswered && !weightOk && (
            <Text className="mt-2 font-archivo text-caption text-primary-dark">
              Minimal 45 kg untuk donor.
            </Text>
          )}

          {/* Pertanyaan */}
          {QS.map((q) => (
            <View key={q.key} className="mt-6">
              <Text className="font-archivo-bold text-body text-ink">{q.text}</Text>
              <Text className="mt-1 font-archivo text-caption text-ink-muted">
                {q.hint}
              </Text>
              <Controller
                control={control}
                name={q.key}
                render={({ field: { value, onChange } }) => (
                  <View className="mt-3 flex-row gap-2">
                    {["Ya", "Tidak"].map((opt) => {
                      const active = value === opt;
                      return (
                        <Pressable
                          key={opt}
                          onPress={() => onChange(opt)}
                          className={`flex-1 items-center rounded-card border py-3 ${
                            active
                              ? "border-primary bg-primary"
                              : "border-line bg-surface"
                          }`}
                        >
                          <Text
                            className={`font-archivo-bold text-body ${
                              active ? "text-white" : "text-ink"
                            }`}
                          >
                            {opt}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              />
            </View>
          ))}
        </ScrollView>

        {/* Banner hasil + CTA */}
        <View className="border-t border-line bg-ground px-6 pb-2 pt-3">
          <View
            className={`mb-3 rounded-[18px] border p-4 ${
              elig.ok ? "border-primary bg-primary-soft" : "border-line bg-surface"
            }`}
          >
            <Text
              className={`font-archivo-bold text-body ${
                elig.ok ? "text-primary-dark" : "text-ink"
              }`}
            >
              {elig.title}
            </Text>
            <Text className="mt-1 font-archivo text-caption text-ink-muted">
              {elig.body}
            </Text>
          </View>

          <Pressable
            onPress={onLanjut}
            disabled={!pass || submitting}
            className={`items-center rounded-pill py-4 ${
              pass ? "bg-primary active:bg-primary-dark" : "bg-line"
            }`}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                className={`font-archivo-bold text-body ${
                  pass ? "text-white" : "text-ink-muted"
                }`}
              >
                Lanjut ke pendaftaran
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
