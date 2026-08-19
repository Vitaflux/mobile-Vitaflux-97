type LogoutFlowOptions = {
  role?: "donor" | "facility";
  unregisterPushToken: () => Promise<unknown>;
  clearLocalToken: () => Promise<void>;
  clearUser: () => void;
  clearCache: () => void;
};

export async function runLogoutFlow({
  role,
  unregisterPushToken,
  clearLocalToken,
  clearUser,
  clearCache,
}: LogoutFlowOptions) {
  if (role === "donor") {
    try {
      await unregisterPushToken();
    } catch {
      // Network cleanup tidak boleh menggagalkan logout lokal.
    }
  }

  await clearLocalToken();
  clearUser();
  clearCache();
}
