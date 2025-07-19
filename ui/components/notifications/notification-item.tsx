"use client";

import { formatDistanceToNow } from "date-fns";
import {
  MessageCircle,
  Phone,
  UserPlus,
  Settings,
  Trash2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";
import {
  Notification,
  NotificationType,
} from "@/components/store/notification-store";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  onClick?: (notification: Notification) => void;
  showActions?: boolean;
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
      return MessageCircle;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case "message":
      return "text-blue-500";
    case "call":
      return "text-green-500";
    case "friend_request":
      return "text-purple-500";
    case "system":
      return "text-muted-foreground";
    default:
      return "text-blue-500";
  }
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  showActions = true,
}: NotificationItemProps) {
  const Icon = getNotificationIcon(notification.type);
  const iconColor = getNotificationColor(notification.type);
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  });

  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    }

    // Auto-mark as read when clicked
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.id);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors",
        !notification.is_read &&
          "bg-blue-50/50 dark:bg-blue-900/10 border-l-2 border-l-blue-500"
      )}
      onClick={handleClick}
    >
      {/* Icon or Avatar */}
      <div className="flex-shrink-0 mt-1">
        {notification.type === "message" ||
        notification.type === "friend_request" ? (
          <UserAvatar
            user={{
              id: notification.related_id || "",
              name: notification.title.split(" ").slice(-2).join(" "), // Extract name from title
              username: "",
              email: "",
              created_at: "",
              updated_at: "",
            }}
            size="sm"
            showStatus={false}
          />
        ) : (
          <div className={cn("p-2 rounded-full bg-muted", iconColor)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4
              className={cn(
                "text-sm font-medium truncate",
                !notification.is_read && "font-semibold"
              )}
            >
              {notification.title}
            </h4>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {notification.content}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{timeAgo}</p>
          </div>

          {/* Unread indicator */}
          {!notification.is_read && (
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
          )}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAsRead}
              className="h-8 w-8 p-0"
              title="Mark as read"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            title="Delete notification"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
