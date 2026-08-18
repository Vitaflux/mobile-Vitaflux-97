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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin } from "lucide-react-native";
import { createBlood, type BloodComponent } from "../../src/api/bloods";
import { getMyHospital } from "../../src/api/hospitals";
import { errorMessage } from "../../src/lib/errorMessage";
import type { BloodType, Rhesus } from "../../src/types/models";

const GOLONGAN: BloodType[] = ["A", "B", "AB", "O"];
const RHESUS: Rhesus[] = ["+", "-"];

const COMPONENTS: {
  value: BloodComponent;
  label: string;
}[] = [
  {
    value: "whole_blood",
    label: "Whole blood",
  },
  {
    value: "plasma",
    label: "Plasma",
  },
  {
    value: "trombosit",
    label: "Trombosit",
  },
  {
    value: "eritrosit",
    label: "Eritrosit",
  },
];

export default function CreateBlood() {
  const qc = useQueryClient();

  const hospitalQuery = useQuery({
    queryKey: ["my-hospital"],
    queryFn: () => getMyHospital(),
  });

  const [title, setTitle] = useState("");
  const [component, setComponent] = useState<BloodComponent>("whole_blood");
  const [golongan, setGolongan] = useState<BloodType>("O");
  const [rhesus, setRhesus] = useState<Rhesus>("+");
  const [qty, setQty] = useState(5);
  const [tanggal, setTanggal] = useState("");
  const [jamMulai, setJamMulai] = useState("");
  const [jamSelesai, setJamSelesai] = useState("");
  const [note, setNote] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [saving, setSaving] = useState(false);

  const dateFormatOk = /^\d{4}-\d{2}-\d{2}$/.test(tanggal);
  const startTimeFormatOk = /^\d{2}:\d{2}$/.test(jamMulai);
  const endTimeFormatOk = /^\d{2}:\d{2}$/.test(jamSelesai);

  const schedule =
    dateFormatOk && startTimeFormatOk
      ? new Date(`${tanggal}T${jamMulai}:00`)
      : null;

  const scheduleEnd =
    dateFormatOk && endTimeFormatOk
      ? new Date(`${tanggal}T${jamSelesai}:00`)
      : null;

  const scheduleValid =
    schedule !== null &&
    scheduleEnd !== null &&
    !Number.isNaN(schedule.getTime()) &&
    !Number.isNaN(scheduleEnd.getTime()) &&
    scheduleEnd.getTime() > schedule.getTime();

  const valid = title.trim().length > 0 && qty >= 1 && scheduleValid;

  const selectedComponent =
    COMPONENTS.find((item) => item.value === component)?.label ?? "Whole blood";

  async function onSubmit() {
    if (!title.trim()) {
      Alert.alert(
        "Judul belum diisi",
        "Isi judul kebutuhan darah terlebih dahulu.",
      );

      return;
    }

    if (!dateFormatOk || !startTimeFormatOk || !endTimeFormatOk) {
      Alert.alert(
        "Jadwal belum lengkap",
        "Isi tanggal dengan format YYYY-MM-DD dan jam dengan format HH:MM.",
      );

      return;
    }

    if (!scheduleValid) {
      Alert.alert(
        "Rentang waktu tidak valid",
        "Jam selesai harus lebih besar dari jam mulai.",
      );

      return;
    }

    setSaving(true);

    try {
      await createBlood({
        title: title.trim(),
        blood_type: golongan,
        rhesus,
        quantity: qty,
        component,
        schedule: `${tanggal}T${jamMulai}:00`,
        schedule_end: `${tanggal}T${jamSelesai}:00`,
        note: note.trim() || null,
        status_blood: urgent ? "urgent" : "normal",
      });

      await qc.invalidateQueries({
        queryKey: ["facility-bloods"],
      });

      Alert.alert("Kebutuhan diterbitkan", "Kebutuhan darah berhasil dibuat.", [
        {
          text: "OK",
          onPress: () => router.replace("/(facility)"),
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Gagal membuat kebutuhan",
        errorMessage(error, "Coba lagi atau periksa koneksi."),
      );
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

          {/* Judul */}
          <Label>Judul kebutuhan</Label>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Contoh: Donor darah rutin Agustus"
            placeholderTextColor="#9B9797"
            maxLength={100}
            className={inputCls}
          />

          {/* Komponen */}
          <Label>Komponen darah</Label>

          <View className="flex-row flex-wrap gap-2">
            {COMPONENTS.map((item) => {
              const active = component === item.value;

              return (
                <Pressable
                  key={item.value}
                  onPress={() => setComponent(item.value)}
                  className={`rounded-pill border px-4 py-3 ${
                    active
                      ? "border-primary bg-primary"
                      : "border-line bg-surface"
                  }`}
                >
                  <Text
                    className={`font-archivo-semibold text-caption ${
                      active ? "text-white" : "text-ink"
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Golongan darah */}
          <Label>Golongan darah</Label>

          <Seg
            options={GOLONGAN}
            value={golongan}
            onChange={(value) => setGolongan(value as BloodType)}
          />

          {/* Rhesus */}
          <Label>Rhesus</Label>

          <Seg
            options={RHESUS}
            value={rhesus}
            onChange={(value) => setRhesus(value as Rhesus)}
          />

          {/* Jumlah */}
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
          <Label>Tanggal</Label>

          <TextInput
            value={tanggal}
            onChangeText={setTanggal}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9B9797"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            className={inputCls}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Label>Jam mulai</Label>

              <TextInput
                value={jamMulai}
                onChangeText={setJamMulai}
                placeholder="HH:MM"
                placeholderTextColor="#9B9797"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                className={inputCls}
              />
            </View>

            <View className="flex-1">
              <Label>Jam selesai</Label>

              <TextInput
                value={jamSelesai}
                onChangeText={setJamSelesai}
                placeholder="HH:MM"
                placeholderTextColor="#9B9797"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                className={inputCls}
              />
            </View>
          </View>

          {/* Lokasi */}
          <Label>Lokasi pengambilan</Label>

          <View className="flex-row items-start p-4 border rounded-card border-line bg-surface">
            <MapPin color="#605D5D" size={20} />

            <View className="flex-1 ml-3">
              {hospitalQuery.isLoading ? (
                <ActivityIndicator color="#EC3013" />
              ) : (
                <>
                  <Text className="font-archivo-semibold text-body text-ink">
                    {hospitalQuery.data?.hospital_name ?? "Fasilitas kesehatan"}
                  </Text>

                  <Text className="mt-1 font-archivo text-caption text-ink-muted">
                    {hospitalQuery.data?.address ??
                      "Alamat faskes belum tersedia"}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Catatan */}
          <Label>Catatan dari faskes</Label>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Tambahkan instruksi atau informasi untuk pendonor"
            placeholderTextColor="#9B9797"
            multiline
            textAlignVertical="top"
            maxLength={500}
            className={`${inputCls} min-h-28`}
          />

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
                Kirim notifikasi ke pendonor yang cocok dalam radius terdekat.
              </Text>
            </View>
          </Pressable>

          {/* Ringkasan */}
          <Text className="mb-2 mt-7 font-archivo-bold text-overline tracking-overline text-ink-muted">
            RINGKASAN
          </Text>

          <View className="rounded-[18px] border border-line bg-surface p-4">
            <Text className="font-archivo-bold text-body text-ink">
              {title.trim() || "Judul kebutuhan"}
            </Text>

            <Text className="mt-2 font-archivo text-caption text-ink-muted">
              {selectedComponent} · {qty} kantong {golongan}
              {rhesus}
            </Text>

            <Text className="mt-1 font-archivo text-caption text-ink-muted">
              {dateFormatOk && startTimeFormatOk && endTimeFormatOk
                ? `${tanggal} · ${jamMulai}–${jamSelesai}`
                : "Jadwal belum lengkap"}
            </Text>

            <View
              className={`self-start px-3 py-1 mt-3 rounded-pill ${
                urgent ? "bg-primary" : "bg-ground"
              }`}
            >
              <Text
                className={`font-archivo-bold text-overline tracking-overline ${
                  urgent ? "text-white" : "text-ink-muted"
                }`}
              >
                {urgent ? "MENDESAK" : "RUTIN"}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* CTA */}
        <View className="px-6 pt-3 pb-2 border-t border-line bg-ground">
          <Pressable
            onPress={onSubmit}
            disabled={saving || !valid}
            className={`items-center rounded-pill py-4 ${
              saving || !valid
                ? "bg-primary/60"
                : "bg-primary active:bg-primary-dark"
            }`}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
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
  "rounded-card border border-line bg-surface px-4 py-[14px] font-archivo text-body text-ink";

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
