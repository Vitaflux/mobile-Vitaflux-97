import { useState } from "react";
import type { ReactNode } from "react";
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
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { createBlood } from "../../src/api/bloods";
import { errorMessage } from "../../src/lib/errorMessage";
import type { BloodType, Rhesus } from "../../src/types/models";

const GOLONGAN: BloodType[] = ["A", "B", "AB", "O"];
const RHESUS: Rhesus[] = ["+", "-"];

export default function CreateBlood() {
  const qc = useQueryClient();

  const [golongan, setGolongan] = useState<BloodType>("O");
  const [rhesus, setRhesus] = useState<Rhesus>("+");
  const [qty, setQty] = useState(5);
  const [tanggal, setTanggal] = useState("");
  const [jam, setJam] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [saving, setSaving] = useState(false);

  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(tanggal);
  const timeOk = /^\d{2}:\d{2}$/.test(jam);

  const valid = qty >= 1 && dateOk && timeOk;

  async function onSubmit() {
    if (!valid) {
      Alert.alert(
        "Lengkapi data",
        "Isi jumlah, tanggal (YYYY-MM-DD), dan jam (HH:MM).",
      );

      return;
    }

    setSaving(true);

    try {
      await createBlood({
        blood_type: golongan,
        rhesus,
        quantity: qty,
        schedule: `${tanggal}T${jam}:00`,
        status_blood: urgent ? "urgent" : "normal",
      });

      await qc.invalidateQueries({
        queryKey: ["facility-bloods"],
      });

      Alert.alert("Terbit", "Kebutuhan berhasil dibuat.", [
        {
          text: "OK",
          onPress: () => router.replace("/(facility)"),
        },
      ]);
    } catch (e: any) {
      Alert.alert("Gagal", errorMessage(e, "Coba lagi atau periksa koneksi."));
    } finally {
      setSaving(false);
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
          <View className="justify-center h-12">
            <Text className="font-archivo-bold text-subjudul text-ink">
              Buat kebutuhan
            </Text>
          </View>

          {/* Golongan darah */}
          <Label>Golongan darah</Label>

          <Seg
            options={GOLONGAN}
            value={golongan}
            onChange={(value) => setGolongan(value as BloodType)}
          />

          {/* Rhesus */}
          <View className="h-4" />

          <Label>Rhesus</Label>

          <Seg
            options={RHESUS}
            value={rhesus}
            onChange={(value) => setRhesus(value as Rhesus)}
          />

          {/* Jumlah */}
          <View className="h-4" />

          <Label>Jumlah pendonor dibutuhkan</Label>

          <View className="flex-row items-center">
            <Stepper
              onPress={() => setQty((current) => Math.max(1, current - 1))}
              label="−"
            />

            <View className="items-center flex-1 mx-4">
              <Text className="font-archivo-black text-judul text-ink">
                {qty}
              </Text>

              <Text className="font-archivo text-caption text-ink-muted">
                kantong
              </Text>
            </View>

            <Stepper
              onPress={() => setQty((current) => current + 1)}
              label="+"
            />
          </View>

          {/* Jadwal */}
          <View className="h-4" />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Label>Tanggal</Label>

              <TextInput
                value={tanggal}
                onChangeText={setTanggal}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9b9797"
                className={inputCls}
              />
            </View>

            <View className="flex-1">
              <Label>Jam</Label>

              <TextInput
                value={jam}
                onChangeText={setJam}
                placeholder="HH:MM"
                placeholderTextColor="#9b9797"
                className={inputCls}
              />
            </View>
          </View>

          {/* Urgent */}
          <Pressable
            onPress={() => setUrgent((current) => !current)}
            className={`mt-6 flex-row items-start rounded-[18px] border p-4 ${
              urgent
                ? "border-primary bg-primary-soft"
                : "border-line bg-surface"
            }`}
          >
            <View
              className={`mr-3 mt-0.5 h-5 w-5 items-center justify-center rounded-sm border ${
                urgent ? "border-primary bg-primary" : "border-line bg-surface"
              }`}
            >
              {urgent ? <Text className="text-xs text-white">✓</Text> : null}
            </View>

            <View className="flex-1">
              <Text className="font-archivo-bold text-body text-ink">
                Tandai mendesak
              </Text>

              <Text className="mt-1 leading-5 font-archivo text-caption text-ink-muted">
                Kirim notifikasi ke pendonor cocok dalam radius terdekat.
              </Text>
            </View>
          </Pressable>

          {/* Ringkasan */}
          <Text className="mb-2 mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
            RINGKASAN
          </Text>

          <View className="rounded-[18px] border border-line bg-surface p-4">
            <Text className="font-archivo text-body text-ink">
              {qty} kantong {golongan}
              {rhesus} · {urgent ? "mendesak" : "rutin"}
              {dateOk && timeOk ? ` · ${tanggal} ${jam}` : ""}
            </Text>
          </View>
        </ScrollView>

        {/* CTA */}
        <View className="px-6 pt-3 pb-2 border-t border-line bg-ground">
          <Pressable
            onPress={onSubmit}
            disabled={saving}
            className={`items-center rounded-pill py-4 ${
              saving ? "bg-primary/60" : "bg-primary active:bg-primary-dark"
            }`}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-archivo-bold text-body">
                Terbitkan
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const inputCls =
  "rounded-card border border-line px-4 py-[14px] font-archivo text-body text-ink";

function Label({ children }: { children: ReactNode }) {
  return (
    <Text className="mt-5 mb-2 font-archivo-medium text-caption text-ink">
      {children}
    </Text>
  );
}

function Stepper({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center w-12 h-12 border rounded-card border-line bg-surface active:bg-ground"
    >
      <Text className="font-archivo-black text-judul text-ink">{label}</Text>
    </Pressable>
  );
}

function Seg({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View className="flex-row gap-2">
      {options.map((option) => {
        const active = option === value;

        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            className={`flex-1 items-center rounded-card border py-3 ${
              active ? "border-primary bg-primary" : "border-line bg-surface"
            }`}
          >
            <Text
              className={`font-archivo-bold text-body ${
                active ? "text-white" : "text-ink"
              }`}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
