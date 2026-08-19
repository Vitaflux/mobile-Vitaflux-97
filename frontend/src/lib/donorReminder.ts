import { Platform } from "react-native";
import * as Calendar from "expo-calendar";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "vitaflux_donor_reminder";
const CHANNEL_ID = "donor-reminders";

export type ReminderTiming = "h-3" | "day";

export type DonorReminder = {
  notificationId: string;
  scheduleAt: string;
  scheduledFor: string;
  timing: ReminderTiming;
};

function parseScheduleDate(scheduleAt: string) {
  const date = new Date(scheduleAt);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Jadwal donor tidak valid.");
  }

  return date;
}

function getReminderDate(
  scheduleAt: string,
  timing: ReminderTiming,
  scheduleEndAt?: string | null,
): Date {
  const date = parseScheduleDate(scheduleAt);

  if (timing === "h-3") {
    date.setDate(date.getDate() - 3);
    return date;
  }

  const now = Date.now();

  if (date.getTime() > now) {
    return date;
  }

  if (scheduleEndAt) {
    const endDate = parseScheduleDate(scheduleEndAt);

    if (endDate.getTime() > now) {
      // Expo membutuhkan trigger DATE di masa depan. Saat jadwal sedang
      // berlangsung, kirim pengingat sesegera mungkin.
      return new Date(now + 1000);
    }
  }

  return date;
}

async function prepareNotificationPermission() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Pengingat donor",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#EC3013",
      sound: "default",
    });
  }

  const current = await Notifications.getPermissionsAsync();

  if (current.status === Notifications.PermissionStatus.GRANTED) {
    return;
  }

  const requested = await Notifications.requestPermissionsAsync();

  if (requested.status !== Notifications.PermissionStatus.GRANTED) {
    throw new Error("Izin notifikasi belum diberikan.");
  }
}

export async function getDonorReminder(): Promise<DonorReminder | null> {
  const stored = await SecureStore.getItemAsync(STORAGE_KEY);

  if (!stored) return null;

  try {
    const reminder = JSON.parse(stored) as Partial<DonorReminder>;

    // Hapus pengingat versi lama yang masih dihitung dari tanggal kelayakan.
    if (!reminder.scheduleAt) {
      if (reminder.notificationId) {
        try {
          await Notifications.cancelScheduledNotificationAsync(
            reminder.notificationId,
          );
        } catch {
          // Notifikasi lama mungkin sudah tidak terjadwal.
        }
      }
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      return null;
    }

    return reminder as DonorReminder;
  } catch {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    return null;
  }
}

export async function cancelDonorReminder() {
  const previous = await getDonorReminder();

  if (previous?.notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(
        previous.notificationId,
      );
    } catch {
      // Notifikasi mungkin sudah muncul atau sudah dibatalkan.
    }
  }

  await SecureStore.deleteItemAsync(STORAGE_KEY);
}

export async function scheduleDonorReminder(
  scheduleAt: string,
  timing: ReminderTiming,
  scheduleEndAt?: string | null,
): Promise<DonorReminder> {
  let reminderDate = getReminderDate(scheduleAt, timing, scheduleEndAt);

  if (reminderDate.getTime() <= Date.now()) {
    throw new Error("Waktu pengingat sudah lewat.");
  }

  await prepareNotificationPermission();
  await cancelDonorReminder();

  // Dialog izin dapat terbuka cukup lama. Hitung ulang agar trigger "segera"
  // untuk jadwal yang sedang berlangsung tetap berada di masa depan.
  reminderDate = getReminderDate(scheduleAt, timing, scheduleEndAt);

  if (reminderDate.getTime() <= Date.now()) {
    throw new Error("Waktu pengingat sudah lewat.");
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title:
        timing === "h-3"
          ? "Jadwal donor tinggal tiga hari lagi"
          : "Jadwal donor dimulai",
      body:
        timing === "h-3"
          ? "Tiga hari lagi adalah jadwal donor yang dikonfirmasi faskes."
          : "Saatnya datang ke fasilitas kesehatan untuk jadwal donormu.",
      sound: "default",
      data: {
        type: "confirmed-donor-schedule",
        route: "/(donor)/pengingat",
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
      channelId: CHANNEL_ID,
    },
  });

  const reminder: DonorReminder = {
    notificationId,
    scheduleAt,
    scheduledFor: reminderDate.toISOString(),
    timing,
  };

  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(reminder));

  return reminder;
}

export async function addDonorScheduleToCalendar(scheduleAt: string) {
  const startDate = parseScheduleDate(scheduleAt);

  const endDate = new Date(startDate);
  endDate.setHours(10, 0, 0, 0);

  return Calendar.createEventInCalendarAsync({
    title: "Jadwal donor — Vitaflux",
    startDate,
    endDate,
    notes: "Jadwal donor yang telah dikonfirmasi oleh fasilitas kesehatan.",
    alarms: [{ relativeOffset: 0 }],
  });
}
