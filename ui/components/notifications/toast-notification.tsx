"use client";

import { useEffect, useState } from "react";
import {
  X,
  Bell,
  MessageCircle,
  Phone,
  UserPlus,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Notification,
  NotificationType,
} from "@/components/store/notification-store";

interface ToastNotificationProps {
  notification: Notification;
  onClose: () => void;
  onAction?: (notification: Notification) => void;
  duration?: number;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "message":
      return MessageCircle;
    case "call":
      return Phone;
    case "friend_request":
      return UserPlus;
    case "system":
      return Settings;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case "message":
      return "border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10";
    case "call":
      return "border-l-green-500 bg-green-50/50 dark:bg-green-900/10";
    case "friend_request":
      return "border-l-purple-500 bg-purple-50/50 dark:bg-purple-900/10";
    case "system":
      return "border-l-gray-500 bg-gray-50/50 dark:bg-gray-900/10";
    default:
      return "border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10";
  }
};

export function ToastNotification({
  notification,
  onClose,
  onAction,
  duration = 5000,
}: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const Icon = getNotificationIcon(notification.type);
  const colorClass = getNotificationColor(notification.type);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const handleClick = () => {
    if (onAction) {
      onAction(notification);
    }
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 w-80 p-4 rounded-lg shadow-lg border-l-4 backdrop-blur-sm transition-all duration-300 cursor-pointer",
        colorClass,
        isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Icon className="h-5 w-5 text-current" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground">
            {notification.title}
          </h4>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {notification.content}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Toast notification manager component
interface ToastManagerProps {
  notifications: Notification[];
  onClose: (notificationId: string) => void;
  onAction?: (notification: Notification) => void;
  maxToasts?: number;
}

export function ToastManager({
  notifications,
  onClose,
  onAction,
  maxToasts = 3,
}: ToastManagerProps) {
  // Show only the most recent notifications
  const visibleNotifications = notifications
    .filter((n) => !n.is_read)
    .slice(0, maxToasts);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            transform: `translateY(${index * 4}px)`,
            zIndex: 50 - index,
          }}
        >
          <ToastNotification
            notification={notification}
            onClose={() => onClose(notification.id)}
            onAction={onAction}
          />
        </div>
      ))}
    </div>
  );
}
