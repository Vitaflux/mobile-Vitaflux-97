import { Platform } from "react-native";
import * as Calendar from "expo-calendar";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "vitaflux_donor_reminder";
const CHANNEL_ID = "donor-reminders";

export type ReminderTiming = "h-3" | "day";

export type DonorReminder = {
  notificationId: string;
  eligibleAt: string;
  scheduledFor: string;
  timing: ReminderTiming;
};

function parseEligibilityDate(eligibleAt: string) {
  const date = new Date(eligibleAt);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Tanggal kelayakan donor tidak valid.");
  }

  return date;
}

function getReminderDate(eligibleAt: string, timing: ReminderTiming): Date {
  const date = parseEligibilityDate(eligibleAt);

  // Pengingat muncul pukul 09.00 waktu lokal.
  date.setHours(9, 0, 0, 0);

  if (timing === "h-3") {
    date.setDate(date.getDate() - 3);
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
    return JSON.parse(stored) as DonorReminder;
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
  eligibleAt: string,
  timing: ReminderTiming,
): Promise<DonorReminder> {
  const reminderDate = getReminderDate(eligibleAt, timing);

  if (reminderDate.getTime() <= Date.now()) {
    throw new Error("Waktu pengingat sudah lewat.");
  }

  await prepareNotificationPermission();
  await cancelDonorReminder();

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title:
        timing === "h-3"
          ? "Sebentar lagi kamu boleh donor"
          : "Kamu sudah boleh donor lagi",
      body:
        timing === "h-3"
          ? "Tiga hari lagi kamu sudah memenuhi jadwal donor berikutnya."
          : "Hari ini kamu sudah memenuhi jadwal donor berikutnya.",
      sound: "default",
      data: {
        type: "donor-eligibility",
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
    eligibleAt,
    scheduledFor: reminderDate.toISOString(),
    timing,
  };

  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(reminder));

  return reminder;
}

export async function addEligibilityToCalendar(eligibleAt: string) {
  const startDate = parseEligibilityDate(eligibleAt);

  startDate.setHours(9, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setHours(10, 0, 0, 0);

  return Calendar.createEventInCalendarAsync({
    title: "Boleh donor lagi — Vitaflux",
    startDate,
    endDate,
    notes:
      "Kamu sudah memenuhi interval minimum dan dapat melakukan donor darah kembali.",
    alarms: [{ relativeOffset: 0 }],
  });
}
