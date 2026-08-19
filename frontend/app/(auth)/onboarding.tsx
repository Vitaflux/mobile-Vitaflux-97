import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";

// Isi 3 langkah — persis dari markup design (.dc.html).
const STEPS = [
  {
    img: "peta & kantong darah",
    title: "Kebutuhan darah, di dekatmu",
    body: "Vitaflux mencocokkan golongan darahmu dengan permintaan dari rumah sakit dan PMI dalam radius yang kamu tentukan.",
  },
  {
    img: "formulir skrining",
    title: "Skrining dulu, baru daftar",
    body: "Kuesioner singkat memastikan kamu memang siap donor — supaya tidak datang jauh-jauh lalu ditolak.",
  },
  {
    img: "kartu donor",
    title: "Riwayat yang bisa dibanggakan",
    body: "Setiap donasi tercatat di Kartu Donor Digital-mu, lengkap dengan pengingat kapan boleh donor lagi.",
  },
];

export default function Onboarding() {
  const [i, setI] = useState(0);
  const last = i === STEPS.length - 1;
  const step = STEPS[i];

  const goLogin = () => router.replace("/(auth)/login");
  const next = () => (last ? goLogin() : setI(i + 1));

  return (
    <View className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1 px-8">
        {/* Lewati */}
        <View className="h-10 flex-row items-center justify-end">
          <Pressable onPress={goLogin} hitSlop={8}>
            <Text className="font-archivo-semibold text-body text-primary-dark">
              Lewati
            </Text>
          </Pressable>
        </View>

        {/* Ilustrasi (placeholder) */}
        <View className="mt-2 h-72 items-center justify-center rounded-sheet border border-dashed border-primary-tint bg-primary-soft">
          <Text className="font-archivo-bold text-overline tracking-overline text-primary-dark">
            ILUSTRASI
          </Text>
          <Text className="mt-2 font-archivo text-caption text-ink-muted">
            placeholder {step.img}
          </Text>
        </View>

        {/* Judul + body */}
        <Text className="mt-8 font-archivo-black text-display leading-tight text-ink">
          {step.title}
        </Text>
        <Text className="mt-3 font-archivo text-body leading-6 text-ink-muted">
          {step.body}
        </Text>

        <View className="flex-1" />

        {/* Dots */}
        <View className="mb-5 flex-row items-center gap-2">
          {STEPS.map((_, idx) => (
            <View
              key={idx}
              className={
                idx === i
                  ? "h-1.5 w-6 rounded-pill bg-primary"
                  : "h-1.5 w-1.5 rounded-pill bg-line"
              }
            />
          ))}
        </View>

        {/* Lanjut / Mulai */}
        <Pressable
          onPress={next}
          className="mb-2 h-14 items-center justify-center rounded-pill bg-primary active:bg-primary-dark"
        >
          <Text className="font-archivo-bold text-body text-white">
            {last ? "Mulai" : "Lanjut"}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
