"use client";

import React, { useState } from "react";
import { UserX, UserCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMessagingStore } from "@/components/store/messaging-store";
import { EmptyState, LoadingSpinner } from "@/components/shared";

export interface BlockedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BlockedUsersModal: React.FC<BlockedUsersModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { blockedUsers, loadingBlockedUsers, unblockUser, unblockingUser } =
    useMessagingStore();

  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);

  const handleUnblock = async (userId: string) => {
    setUnblockingUserId(userId);
    try {
      await unblockUser(userId);
    } catch (error) {
      console.error("Failed to unblock user:", error);
    } finally {
      setUnblockingUserId(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Blocked Users</DialogTitle>
          <DialogDescription>Manage users you have blocked</DialogDescription>
        </DialogHeader>
        <div className="max-h-96">
          {loadingBlockedUsers ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : blockedUsers.length === 0 ? (
            <EmptyState
              icon={<UserX className="h-8 w-8 text-muted-foreground" />}
              title="No blocked users"
              description="You haven't blocked any users yet"
            />
          ) : (
            <ScrollArea className="max-h-80">
              <div className="space-y-3">
                {blockedUsers.map((blockedUser) => (
                  <div
                    key={blockedUser.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={blockedUser.blocked_user.avatar_url}
                          alt={blockedUser.blocked_user.name}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getInitials(blockedUser.blocked_user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {blockedUser.blocked_user.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{blockedUser.blocked_user.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Blocked on{" "}
                          {new Date(
                            blockedUser.blocked_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblock(blockedUser.blocked_user.id)}
                      disabled={
                        unblockingUser ||
                        unblockingUserId === blockedUser.blocked_user.id
                      }
                    >
                      {unblockingUserId === blockedUser.blocked_user.id ? (
                        "Unblocking..."
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Unblock
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
