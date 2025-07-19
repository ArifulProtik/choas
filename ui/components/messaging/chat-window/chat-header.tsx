"use client";

import React from "react";
import { Phone, Search, Info, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { getStatusText, formatLastSeen } from "@/lib/utils/messaging-utils";
import { ChatHeaderProps } from "./types";
import { useCallStore } from "@/components/store/call-store";
import { cn } from "@/lib/utils";

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  otherUser,
  userPresence,
  isOnline,
  canCall,
  onCallClick,
  onSearchClick,
  onInfoClick,
  showUserProfile = false,
}) => {
  const { activeCall, incomingCall, callStatus, canInitiateCall } =
    useCallStore();

  // Check if we're in a call with this specific user
  const isInCallWithUser =
    activeCall &&
    (activeCall.caller.id === otherUser.id ||
      activeCall.callee.id === otherUser.id);

  // Determine call button state
  const getCallButtonState = () => {
    if (isInCallWithUser) {
      return {
        disabled: false,
        variant: "destructive" as const,
        icon: PhoneOff,
        tooltip: "End call",
      };
    }

    if (!canInitiateCall() || !canCall.canCall) {
      return {
        disabled: true,
        variant: "ghost" as const,
        icon: Phone,
        tooltip: canCall.reason || "Cannot initiate call",
      };
    }

    return {
      disabled: false,
      variant: "ghost" as const,
      icon: Phone,
      tooltip: "Start voice call",
    };
  };

  const callButtonState = getCallButtonState();

  return (
    <div className="flex items-center justify-between p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        <UserAvatar
          user={otherUser}
          size="md"
          showStatus={true}
          userPresence={userPresence}
        />

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{otherUser.name}</h2>
          <p className="text-sm text-muted-foreground">
            {isOnline
              ? getStatusText(userPresence?.status || "online")
              : userPresence?.last_seen_at
              ? `Last seen ${formatLastSeen(userPresence.last_seen_at)}`
              : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0"
          onClick={onSearchClick}
          title="Search in conversation"
        >
          <Search className="h-4 w-4" />
        </Button>

        <Button
          variant={callButtonState.variant}
          size="sm"
          className={cn(
            "h-9 w-9 p-0",
            isInCallWithUser && "bg-red-500 hover:bg-red-600 text-white"
          )}
          disabled={callButtonState.disabled}
          onClick={onCallClick}
          title={callButtonState.tooltip}
        >
          <callButtonState.icon className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 w-9 p-0 transition-colors",
            showUserProfile && "bg-accent"
          )}
          onClick={onInfoClick}
          title="User info"
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
