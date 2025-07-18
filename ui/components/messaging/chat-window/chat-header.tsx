"use client";

import React from "react";
import { Phone, Search, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/messaging/shared/user-avatar";
import { getStatusText, formatLastSeen } from "@/lib/utils/messaging-utils";
import { ChatHeaderProps } from "./types";
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
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0"
          disabled={!canCall.canCall}
          onClick={onCallClick}
        >
          <Phone className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 w-9 p-0 transition-colors",
            showUserProfile && "bg-accent"
          )}
          onClick={onInfoClick}
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
