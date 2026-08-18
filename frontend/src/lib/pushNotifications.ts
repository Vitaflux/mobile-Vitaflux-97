import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { updatePushToken } from "../api/notifications";

export type PushRegistrationResult =
  | "registered"
  | "permission-denied"
  | "expo-go"
  | "project-id-missing"
  | "failed";

export async function registerPushTokenForCurrentDevice(): Promise<PushRegistrationResult> {
  try {
    // Remote push tidak tersedia di Expo Go untuk SDK 53+.
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      return "expo-go";
    }

    // Android 13+ membutuhkan notification channel
    // sebelum meminta token.
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Vitaflux",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#EC3013",
      });
    }

    const currentPermission = await Notifications.getPermissionsAsync();

    let finalStatus = currentPermission.status;

    if (finalStatus !== "granted") {
      const requestedPermission = await Notifications.requestPermissionsAsync();

      finalStatus = requestedPermission.status;
    }

    if (finalStatus !== "granted") {
      return "permission-denied";
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      return "project-id-missing";
    }

    const expoPushToken = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    await updatePushToken(expoPushToken.data);

    return "registered";
  } catch {
    // Registrasi push tidak boleh menggagalkan login.
    return "failed";
  }
}
