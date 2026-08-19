import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { runLogoutFlow } from "../src/lib/logoutFlow.ts";
import {
  getDonorReminderStorageKey,
  rescheduleReminderIfEligibilityChanged,
} from "../src/lib/reminderFlow.ts";

test("donor profile update payload does not send last_donor", async () => {
  const profileSource = await readFile(
    new URL("../app/(donor)/profile.tsx", import.meta.url),
    "utf8",
  );
  const payload = profileSource.match(
    /await updateMyProfile\(\{([\s\S]*?)\n\s*\}\);/,
  );

  assert.ok(payload, "updateMyProfile payload was not found");
  assert.doesNotMatch(payload[1], /last_donor/);
});

test("reminder storage is isolated by user ID", () => {
  assert.equal(
    getDonorReminderStorageKey("donor-a"),
    "vitaflux_donor_reminder:donor-a",
  );
  assert.notEqual(
    getDonorReminderStorageKey("donor-a"),
    getDonorReminderStorageKey("donor-b"),
  );
});

test("eligibility reschedule cancels the old notification before scheduling", async () => {
  const events = [];
  const previous = {
    eligibleAt: "2026-08-19T00:00:00.000Z",
    timing: "h-3",
  };

  const result = await rescheduleReminderIfEligibilityChanged(
    previous,
    "2026-11-17T00:00:00.000Z",
    async () => {
      events.push("cancel");
    },
    async (eligibleAt, timing) => {
      events.push("schedule");
      return { eligibleAt, timing };
    },
  );

  assert.deepEqual(events, ["cancel", "schedule"]);
  assert.equal(result?.eligibleAt, "2026-11-17T00:00:00.000Z");
  assert.equal(result?.timing, "h-3");
});

test("failed push unregister still completes local donor logout", async () => {
  const events = [];

  await runLogoutFlow({
    role: "donor",
    unregisterPushToken: async () => {
      events.push("unregister");
      throw new Error("network unavailable");
    },
    clearLocalToken: async () => {
      events.push("token");
    },
    clearUser: () => {
      events.push("user");
    },
    clearCache: () => {
      events.push("cache");
    },
  });

  assert.deepEqual(events, ["unregister", "token", "user", "cache"]);
});
