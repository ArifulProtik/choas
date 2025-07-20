"use client";

import { useState } from "react";
import { Bell, MoreHorizontal, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBadge } from "@/components/shared/notification-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  useNotificationStore,
  NotificationType,
} from "@/components/store/notification-store";
import { cn } from "@/lib/utils";

interface NotificationPopoverProps {
  className?: string;
}

const notificationTabs = [
  { id: "for-you", label: "For You", type: undefined },
  { id: "unreads", label: "Unreads", type: undefined },
  { id: "mentions", label: "Mentions", type: "message" as NotificationType },
];

// Helper function to format time ago
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
};

export function NotificationPopover({ className }: NotificationPopoverProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("for-you");

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getFilteredNotifications,
    getUnreadNotifications,
  } = useNotificationStore();

  const getTabNotifications = () => {
    switch (activeTab) {
      case "unreads":
        return getUnreadNotifications();
      case "mentions":
        return notifications.filter((n) => n.type === "message");
      default:
        return notifications;
    }
  };

  const handleNotificationAction = (
    notificationId: string,
    action: "read" | "delete"
  ) => {
    if (action === "read") {
      markAsRead(notificationId);
    } else if (action === "delete") {
      deleteNotification(notificationId);
    }
  };

  const tabNotifications = getTabNotifications();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <NotificationBadge
              count={unreadCount}
              className="absolute -top-1 -right-1"
              size="sm"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-96 p-0 max-h-[600px] overflow-hidden bg-background",
          className
        )}
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold">Inbox</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Bell className="h-4 w-4" />
            </Button>
            {unreadCount > 0 && (
              <span className="text-sm font-medium">{unreadCount}</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col h-full"
        >
          <TabsList className="grid w-full grid-cols-3 m-0 rounded-none border-b bg-transparent h-auto">
            {notificationTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent py-3"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {notificationTabs.map((tab) => (
              <TabsContent
                key={tab.id}
                value={tab.id}
                className="h-full overflow-y-auto mt-0"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center py-8 text-destructive">
                    <p>Error loading notifications</p>
                  </div>
                ) : tabNotifications.length === 0 ? (
                  <EmptyState
                    icon={<Bell className="h-8 w-8" />}
                    title="No notifications"
                    description="You're all caught up!"
                  />
                ) : (
                  <div>
                    {tabNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="group flex items-start gap-3 p-3 hover:bg-muted/50 relative border-b border-border/50 last:border-b-0"
                      >
                        {/* Green check indicator for read notifications */}
                        {notification.is_read && (
                          <div className="absolute left-8 top-8 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center z-10">
                            <Check className="h-2 w-2 text-white" />
                          </div>
                        )}

                        {/* Avatar */}
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex-shrink-0 flex items-center justify-center text-white font-medium text-sm">
                          {notification.title.charAt(0).toUpperCase()}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">
                              {notification.title
                                .split(" ")
                                .slice(0, 1)
                                .join(" ")}
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {notification.content}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!notification.is_read && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleNotificationAction(
                                      notification.id,
                                      "read"
                                    )
                                  }
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Mark as read
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() =>
                                  handleNotificationAction(
                                    notification.id,
                                    "delete"
                                  )
                                }
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
