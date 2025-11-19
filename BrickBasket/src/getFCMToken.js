import { messaging } from "./firebase";
import { getToken } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "./firebase";
import { getAuth } from "firebase/auth";

export async function registerFCMToken() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const token = await getToken(messaging, {
      vapidKey: "BCNJMQIXwJpg7IwQBpBldjPUAPsTE88ukZEw0oqoP8VqDHCzTu12WPiEAyTaFR_95d28LmpPxHHZkxYZArq6qh4",
    });

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return;

    await updateDoc(doc(firestore, "users", user.uid), {
      fcmToken: token,
    });

    console.log("FCM Token saved:", token);

  } catch (err) {
    console.error("Error getting FCM token:", err);
  }
}
