export type ReminderState = {
  eligibleAt: string;
  timing: "h-3" | "day";
};

const STORAGE_KEY_PREFIX = "vitaflux_donor_reminder";

export function getDonorReminderStorageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

export async function rescheduleReminderIfEligibilityChanged<
  TReminder extends ReminderState,
>(
  previous: TReminder | null,
  eligibleAt: string | null,
  cancel: () => Promise<void>,
  schedule: (
    eligibleAt: string,
    timing: TReminder["timing"],
  ) => Promise<TReminder>,
): Promise<TReminder | null> {
  if (!previous || previous.eligibleAt === eligibleAt) {
    return previous;
  }

  await cancel();

  if (!eligibleAt) {
    return null;
  }

  return schedule(eligibleAt, previous.timing);
}
