"use client";

import { useState } from "react";
import { Bell, Filter, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationItem } from "./notification-item";
import { NotificationBadge } from "@/components/shared/notification-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  useNotificationStore,
  NotificationType,
} from "@/components/store/notification-store";
import { cn } from "@/lib/utils";

interface NotificationCenterProps {
  trigger?: React.ReactNode;
  className?: string;
}

const notificationTabs = [
  { id: "all", label: "All", type: undefined },
  { id: "messages", label: "Messages", type: "message" as NotificationType },
  { id: "calls", label: "Calls", type: "call" as NotificationType },
  {
    id: "friends",
    label: "Friends",
    type: "friend_request" as NotificationType,
  },
  { id: "system", label: "System", type: "system" as NotificationType },
];

export function NotificationCenter({
  trigger,
  className,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    setFilter,
    getFilteredNotifications,
    getUnreadCountByType,
  } = useNotificationStore();

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const tab = notificationTabs.find((t) => t.id === tabId);
    setFilter({ type: tab?.type });
  };

  const handleNotificationClick = (notification: any) => {
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
    setOpen(false);
  };

  const filteredNotifications = getFilteredNotifications();

  const defaultTrigger = (
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
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className={cn("max-w-2xl max-h-[80vh] p-0", className)}>
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <NotificationBadge count={unreadCount} size="sm" />
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {/* Filter dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setFilter({ is_read: false })}
                  >
                    Show unread only
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setFilter({ is_read: true })}
                  >
                    Show read only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter({})}>
                    Show all
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mark all as read */}
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </Button>
              )}

              {/* Clear all */}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="text-destructive hover:text-destructive"
                  title="Clear all notifications"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="h-full flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-5 mx-6 mb-4">
              {notificationTabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="relative">
                  {tab.label}
                  {tab.id !== "all" && getUnreadCountByType(tab.type!) > 0 && (
                    <NotificationBadge
                      count={getUnreadCountByType(tab.type!)}
                      className="absolute -top-1 -right-1"
                      size="sm"
                    />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {notificationTabs.map((tab) => (
              <TabsContent
                key={tab.id}
                value={tab.id}
                className="flex-1 overflow-hidden mt-0"
              >
                <div className="h-full overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center py-8 text-destructive">
                      <p>Error loading notifications: {error}</p>
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <EmptyState
                      icon={<Bell className="h-8 w-8" />}
                      title="No notifications"
                      description={
                        tab.id === "all"
                          ? "You're all caught up! No new notifications."
                          : `No ${tab.label.toLowerCase()} notifications.`
                      }
                    />
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredNotifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={markAsRead}
                          onDelete={deleteNotification}
                          onClick={handleNotificationClick}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Compact notification list for sidebar or other small spaces
interface NotificationListProps {
  maxItems?: number;
  showHeader?: boolean;
  className?: string;
}

export function NotificationList({
  maxItems = 5,
  showHeader = true,
  className,
}: NotificationListProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    deleteNotification,
  } = useNotificationStore();

  const recentNotifications = notifications.slice(0, maxItems);

  if (isLoading) {
    return (
      <div className={cn("p-4", className)}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={cn("", className)}>
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Recent Notifications
            {unreadCount > 0 && (
              <NotificationBadge count={unreadCount} size="sm" />
            )}
          </h3>
        </div>
      )}

      {recentNotifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title="No notifications"
          description="You're all caught up!"
        />
      ) : (
        <div className="divide-y divide-border">
          {recentNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              showActions={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
