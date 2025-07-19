"use client";

import { useState } from "react";
import { User } from "@/lib/schemas/user";
import { useMessagingStore } from "@/components/store/messaging-store";
import { useAuthStore } from "@/components/store/auth-store";
import { Button } from "@/components/ui/button";
import { UserPlus, Check, Clock } from "lucide-react";

interface SendFriendRequestProps {
  user: User;
  size?: "sm" | "md" | "lg";
}

export function SendFriendRequest({
  user,
  size = "sm",
}: SendFriendRequestProps) {
  const [isSending, setIsSending] = useState(false);

  const { user: currentUser } = useAuthStore();
  const { getFriendshipStatusWithUser, addFriendRequest, currentUserId } =
    useMessagingStore();

  const friendshipStatus = getFriendshipStatusWithUser(user.id);

  const handleSendRequest = async () => {
    if (!currentUserId || friendshipStatus !== "not_friends") return;

    setIsSending(true);
    try {
      // Create a new friend request
      const friendRequest = {
        id: `freq_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        requester: currentUser || {
          id: currentUserId || "",
          name: "Current User",
          username: "current_user",
          email: "current@example.com",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        recipient: user,
        status: "pending" as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      addFriendRequest(friendRequest);
    } catch (error) {
      console.error("Failed to send friend request:", error);
    } finally {
      setIsSending(false);
    }
  };

  const getButtonContent = () => {
    switch (friendshipStatus) {
      case "friends":
        return {
          icon: <Check className="w-4 h-4" />,
          text: "Friends",
          variant: "outline" as const,
          disabled: true,
        };
      case "pending_sent":
        return {
          icon: <Clock className="w-4 h-4" />,
          text: "Pending",
          variant: "outline" as const,
          disabled: true,
        };
      case "pending_received":
        return {
          icon: <UserPlus className="w-4 h-4" />,
          text: "Respond",
          variant: "default" as const,
          disabled: false,
        };
      default:
        return {
          icon: <UserPlus className="w-4 h-4" />,
          text: "Add Friend",
          variant: "default" as const,
          disabled: false,
        };
    }
  };

  const buttonContent = getButtonContent();

  return (
    <Button
      size={size}
      variant={buttonContent.variant}
      onClick={handleSendRequest}
      disabled={buttonContent.disabled || isSending}
      className="flex items-center gap-2"
    >
      {buttonContent.icon}
      {isSending ? "Sending..." : buttonContent.text}
    </Button>
  );
}
