import { useCallback, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Bell, ChevronRight } from "lucide-react-native";

import { getDonorReminder } from "../lib/donorReminder";
import type { DonorReminder } from "../lib/donorReminder";

function formatReminderDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DonorReminderCard() {
  const [reminder, setReminder] = useState<DonorReminder | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadReminder() {
        try {
          const storedReminder = await getDonorReminder();

          if (!active) return;

          const scheduledTime = storedReminder
            ? new Date(storedReminder.scheduledFor).getTime()
            : 0;

          if (
            storedReminder &&
            Number.isFinite(scheduledTime) &&
            scheduledTime > Date.now()
          ) {
            setReminder(storedReminder);
          } else {
            setReminder(null);
          }
        } catch {
          if (active) {
            setReminder(null);
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      loadReminder();

      return () => {
        active = false;
      };
    }, []),
  );

  if (loading) return null;

  return (
    <Pressable
      onPress={() => router.push("/(donor)/pengingat")}
      className={`mt-4 flex-row items-center rounded-[18px] border p-4 ${
        reminder ? "border-primary bg-primary-soft" : "border-line bg-surface"
      }`}
    >
      <View
        className={`items-center justify-center w-12 h-12 mr-4 rounded-card ${
          reminder ? "bg-primary" : "bg-ground"
        }`}
      >
        <Bell color={reminder ? "#FFFFFF" : "#A31B0A"} size={23} />
      </View>

      <View className="flex-1">
        <Text
          className={`font-archivo-bold text-body ${
            reminder ? "text-primary-dark" : "text-ink"
          }`}
        >
          {reminder ? "Pengingat donor aktif" : "Atur pengingat donor"}
        </Text>

        <Text className="mt-1 leading-5 font-archivo text-caption text-ink-muted">
          {reminder
            ? formatReminderDate(reminder.scheduledFor)
            : "Dapatkan notifikasi saat kamu sudah boleh donor lagi."}
        </Text>

        {reminder ? (
          <Text className="mt-1 font-archivo-semibold text-caption text-primary-dark">
            {reminder.timing === "h-3"
              ? "3 hari sebelum jadwal"
              : "Pada hari kelayakan"}
          </Text>
        ) : null}
      </View>

      <ChevronRight color="#6F6A68" size={21} />
    </Pressable>
  );
}
