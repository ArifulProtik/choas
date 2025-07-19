"use client";

import { useEffect } from "react";
import { useNotificationStore } from "./notification-store";
import { useMessagingStore } from "./messaging-store";
import { useAuthStore } from "./auth-store";

export function StoreInitializer() {
  const { user } = useAuthStore();
  const { initialize: initializeNotifications } = useNotificationStore();
  const { initialize: initializeMessaging } = useMessagingStore();

  useEffect(() => {
    if (user) {
      // Initialize stores when user is authenticated
      initializeNotifications();
      initializeMessaging(user.id);
    }
  }, [user, initializeNotifications, initializeMessaging]);

  return null;
}
