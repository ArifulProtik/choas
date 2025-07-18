"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ConversationListHeaderProps {
  totalUnreadCount: number;
  onStartConversation: () => void;
}

export const ConversationListHeader: React.FC<ConversationListHeaderProps> = ({
  totalUnreadCount,
  onStartConversation,
}) => {
  return (
    <div className="px-4 py-2 border-b border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Direct Messages
          </h2>
          {totalUnreadCount > 0 && (
            <Badge variant="default" className="h-4 min-w-4 px-1 text-xs">
              {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onStartConversation}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
