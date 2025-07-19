"use client";

import React, { useState } from "react";
import {
  MoreHorizontal,
  Archive,
  Trash2,
  UserX,
  ArchiveRestore,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMessagingStore } from "@/components/store/messaging-store";
import { Conversation } from "@/lib/schemas/messaging";
import { getOtherParticipant } from "@/lib/utils/messaging-utils";

export interface ConversationActionsProps {
  conversation: Conversation;
  currentUserId: string;
}

export const ConversationActions: React.FC<ConversationActionsProps> = ({
  conversation,
  currentUserId,
}) => {
  const {
    archiveConversation,
    unarchiveConversation,
    deleteConversation,
    blockUser,
    isUserBlocked,
    blockingUser,
  } = useMessagingStore();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  const otherUser = getOtherParticipant(conversation, currentUserId);
  const isBlocked = isUserBlocked(otherUser.id);

  const handleArchive = () => {
    if (conversation.is_archived) {
      unarchiveConversation(conversation.id);
    } else {
      archiveConversation(conversation.id);
    }
  };

  const handleDelete = () => {
    deleteConversation(conversation.id);
    setShowDeleteDialog(false);
  };

  const handleBlock = async () => {
    try {
      await blockUser(otherUser.id);
      setShowBlockDialog(false);
    } catch (error) {
      console.error("Failed to block user:", error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleArchive}>
            {conversation.is_archived ? (
              <>
                <ArchiveRestore className="h-4 w-4 mr-2" />
                Unarchive
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowBlockDialog(true)}
            variant="destructive"
            disabled={isBlocked}
          >
            <UserX className="h-4 w-4 mr-2" />
            {isBlocked
              ? "User Blocked"
              : `Block ${otherUser.name.split(" ")[0]}`}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            variant="destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Conversation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation with{" "}
              {otherUser.name}? This action cannot be undone and will remove the
              conversation from your view.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block User Confirmation Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block {otherUser.name}</DialogTitle>
            <DialogDescription>
              Are you sure you want to block {otherUser.name}? They will no
              longer be able to send you messages or call you. You can unblock
              them later from your blocked users list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlock}
              disabled={blockingUser}
            >
              {blockingUser ? "Blocking..." : "Block User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
