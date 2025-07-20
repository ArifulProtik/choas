"use client";

import { useEffect, useState } from "react";
import { ToastManager } from "./toast-notification";
import {
  useNotificationStore,
  Notification,
} from "@/components/store/notification-store";

export function GlobalToastManager() {
  const { notifications, markAsRead } = useNotificationStore();
  const [toastNotifications, setToastNotifications] = useState<Notification[]>(
    []
  );

  // Show toast for new unread notifications
  useEffect(() => {
    const unreadNotifications = notifications.filter((n) => !n.is_read);

    // Only show toast for notifications that are less than 30 seconds old
    const recentNotifications = unreadNotifications.filter((n) => {
      const notificationTime = new Date(n.created_at).getTime();
      const now = Date.now();
      const thirtySecondsAgo = now - 30 * 1000;
      return notificationTime > thirtySecondsAgo;
    });

    setToastNotifications(recentNotifications);
  }, [notifications]);

  const handleToastClose = (notificationId: string) => {
    setToastNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    );
  };

  const handleToastAction = (notification: Notification) => {
    // Mark as read when user clicks on toast
    markAsRead(notification.id);

    // Handle navigation based on notification type
    switch (notification.type) {
      case "message":
        // Navigate to conversation
        console.log("Navigate to conversation:", notification.related_id);
        break;
      case "friend_request":
        // Navigate to friend requests
        console.log("Navigate to friend requests");
        break;
      case "call":
        // Navigate to call history or conversation
        console.log("Navigate to call:", notification.related_id);
        break;
      default:
        break;
    }
  };

  return (
    <ToastManager
      notifications={toastNotifications}
      onClose={handleToastClose}
      onAction={handleToastAction}
      maxToasts={3}
    />
  );
}
