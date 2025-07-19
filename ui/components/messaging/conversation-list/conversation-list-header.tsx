"use client";

import React from "react";
import { Plus, UserX, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ConversationListHeaderProps {
  totalUnreadCount: number;
  onStartConversation: () => void;
  onShowBlockedUsers: () => void;
  onToggleArchived: () => void;
  showArchived: boolean;
}

export const ConversationListHeader: React.FC<ConversationListHeaderProps> = ({
  totalUnreadCount,
  onStartConversation,
  onShowBlockedUsers,
  onToggleArchived,
  showArchived,
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <UserX className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onToggleArchived}>
                <Archive className="h-4 w-4 mr-2" />
                {showArchived ? "Show Active" : "Show Archived"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShowBlockedUsers}>
                <UserX className="h-4 w-4 mr-2" />
                Blocked Users
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
