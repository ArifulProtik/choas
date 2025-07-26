import { Api, handleApiCall, handlePaginatedApiCall } from "./api";
import {
  InAppNotification,
  NotificationPreferences,
} from "../schemas/messaging";
import {
  UpdateNotificationPreferencesPayload,
  PaginatedResponse,
} from "../schemas/api-types";

export class NotificationsApiService {
  /**
   * Get user's notifications with offset-based pagination (matching backend implementation)
   */
  static async getNotifications(
    params: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<InAppNotification[]> {
    return handleApiCall(() => Api.get("/notifications", { params }));
  }

  /**
   * Get unread notifications count (calculated from notifications list since backend doesn't have dedicated endpoint)
   */
  static async getUnreadCount(): Promise<{ count: number }> {
    const notifications = await this.getNotifications({
      limit: 100,
      offset: 0,
    });
    const count = notifications.filter((n) => !n.read).length;
    return { count };
  }

  /**
   * Mark a specific notification as read (matching backend implementation)
   */
  static async markNotificationAsRead(
    notificationId: string
  ): Promise<{ message: string }> {
    return handleApiCall(() =>
      Api.put(`/notifications/${notificationId}/read`)
    );
  }

  /**
   * Mark all notifications as read (matching backend implementation)
   */
  static async markAllNotificationsAsRead(): Promise<{ message: string }> {
    return handleApiCall(() => Api.put("/notifications/read-all"));
  }

  /**
   * Delete a specific notification (matching backend implementation)
   */
  static async deleteNotification(
    notificationId: string
  ): Promise<{ message: string }> {
    return handleApiCall(() => Api.delete(`/notifications/${notificationId}`));
  }

  /**
   * Delete multiple notifications
   */
  static async deleteNotifications(notificationIds: string[]): Promise<void> {
    return handleApiCall(() =>
      Api.delete("/notifications", {
        data: { notification_ids: notificationIds },
      })
    );
  }

  /**
   * Delete all read notifications
   */
  static async deleteAllReadNotifications(): Promise<void> {
    return handleApiCall(() => Api.delete("/notifications/read"));
  }

  /**
   * Get notification preferences
   */
  static async getNotificationPreferences(): Promise<NotificationPreferences> {
    return handleApiCall(() => Api.get("/notifications/preferences"));
  }

  /**
   * Update notification preferences
   */
  static async updateNotificationPreferences(
    preferences: UpdateNotificationPreferencesPayload
  ): Promise<NotificationPreferences> {
    return handleApiCall(() =>
      Api.put("/notifications/preferences", preferences)
    );
  }

  /**
   * Test notification delivery
   */
  static async testNotification(type: "push" | "email" | "in_app"): Promise<{
    success: boolean;
    message: string;
  }> {
    return handleApiCall(() => Api.post("/notifications/test", { type }));
  }

  /**
   * Get notification history for a specific conversation
   */
  static async getConversationNotifications(
    conversationId: string,
    params: {
      limit?: number;
      cursor?: string;
    } = {}
  ): Promise<PaginatedResponse<InAppNotification>> {
    return handlePaginatedApiCall(() =>
      Api.get(`/notifications/conversation/${conversationId}`, { params })
    );
  }

  /**
   * Get notification history for a specific user
   */
  static async getUserNotifications(
    userId: string,
    params: {
      limit?: number;
      cursor?: string;
      type?: "message" | "call" | "friend_request";
    } = {}
  ): Promise<PaginatedResponse<InAppNotification>> {
    return handlePaginatedApiCall(() =>
      Api.get(`/notifications/user/${userId}`, { params })
    );
  }

  /**
   * Snooze notifications for a specific duration
   */
  static async snoozeNotifications(
    duration_minutes: number,
    types?: ("message" | "call" | "friend_request")[]
  ): Promise<{
    snoozed_until: string;
    types: string[];
  }> {
    return handleApiCall(() =>
      Api.post("/notifications/snooze", {
        duration_minutes,
        types,
      })
    );
  }

  /**
   * Unsnooze notifications
   */
  static async unsnoozeNotifications(): Promise<void> {
    return handleApiCall(() => Api.delete("/notifications/snooze"));
  }

  /**
   * Get snooze status
   */
  static async getSnoozeStatus(): Promise<{
    is_snoozed: boolean;
    snoozed_until?: string;
    snoozed_types?: string[];
  }> {
    return handleApiCall(() => Api.get("/notifications/snooze/status"));
  }

  /**
   * Register device for push notifications
   */
  static async registerPushDevice(
    deviceToken: string,
    platform: "ios" | "android" | "web"
  ): Promise<void> {
    return handleApiCall(() =>
      Api.post("/notifications/push/register", {
        device_token: deviceToken,
        platform,
      })
    );
  }

  /**
   * Unregister device from push notifications
   */
  static async unregisterPushDevice(deviceToken: string): Promise<void> {
    return handleApiCall(() =>
      Api.delete("/notifications/push/unregister", {
        data: { device_token: deviceToken },
      })
    );
  }

  /**
   * Get notification delivery status
   */
  static async getDeliveryStatus(notificationId: string): Promise<{
    delivered: boolean;
    delivery_attempts: number;
    last_attempt_at?: string;
    error_message?: string;
  }> {
    return handleApiCall(() =>
      Api.get(`/notifications/${notificationId}/delivery-status`)
    );
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats(
    params: {
      start_date?: string;
      end_date?: string;
      type?: "message" | "call" | "friend_request" | "system";
    } = {}
  ): Promise<{
    total_sent: number;
    total_delivered: number;
    total_read: number;
    delivery_rate: number;
    read_rate: number;
    breakdown_by_type: Record<
      string,
      {
        sent: number;
        delivered: number;
        read: number;
      }
    >;
  }> {
    return handleApiCall(() => Api.get("/notifications/stats", { params }));
  }

  /**
   * Create a custom notification (for admin/system use)
   */
  static async createNotification(notification: {
    title: string;
    message: string;
    type: "message" | "call" | "system";
    user_ids?: string[];
    conversation_id?: string;
    call_id?: string;
    priority?: "low" | "normal" | "high";
  }): Promise<InAppNotification> {
    return handleApiCall(() => Api.post("/notifications", notification));
  }
}
