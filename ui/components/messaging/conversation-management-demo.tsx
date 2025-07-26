"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConversationActions } from "./conversation-list/conversation-actions";
import { BlockedUsersModal } from "./blocked-users-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMessagingStore } from "@/components/store/messaging-store";
// Mock data imports removed - now using real backend data

export const ConversationManagementDemo: React.FC = () => {
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const {
    conversations,
    blockedUsers,
    archiveConversation,
    unarchiveConversation,
    deleteConversation,
    blockUser,
    unblockUser,
  } = useMessagingStore();

  const testConversation = conversations[0];
  // TODO: Get current user from auth store instead of mock data
  const currentUser = { id: "current-user" }; // Placeholder

  const handleArchiveTest = () => {
    if (testConversation) {
      if (testConversation.is_archived) {
        unarchiveConversation(testConversation.id);
      } else {
        archiveConversation(testConversation.id);
      }
    }
  };

  const handleDeleteTest = () => {
    if (testConversation) {
      deleteConversation(testConversation.id);
      setShowDeleteDialog(false);
    }
  };

  const handleBlockTest = async () => {
    if (testConversation) {
      const otherUser =
        testConversation.participant1.id === currentUser.id
          ? testConversation.participant2
          : testConversation.participant1;

      try {
        await blockUser(otherUser.id);
      } catch (error) {
        console.error("Failed to block user:", error);
      }
    }
  };

  const handleUnblockTest = async () => {
    if (blockedUsers.length > 0) {
      try {
        await unblockUser(blockedUsers[0].blocked_user.id);
      } catch (error) {
        console.error("Failed to unblock user:", error);
      }
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">
        Conversation Management Demo
      </h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Conversation Actions</h3>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleArchiveTest} variant="outline">
              {testConversation?.is_archived ? "Unarchive" : "Archive"}{" "}
              Conversation
            </Button>
            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive"
            >
              Delete Conversation
            </Button>
            <Button onClick={handleBlockTest} variant="outline">
              Block User
            </Button>
          </div>

          {testConversation && (
            <div className="mt-2 p-2 bg-muted rounded">
              <ConversationActions
                conversation={testConversation}
                currentUserId={currentUser.id}
              />
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Blocked Users Management</h3>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowBlockedUsers(true)} variant="outline">
              Show Blocked Users ({blockedUsers.length})
            </Button>
            {blockedUsers.length > 0 && (
              <Button onClick={handleUnblockTest} variant="outline">
                Unblock First User
              </Button>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Current State</h3>
          <div className="text-sm space-y-1">
            <p>Total Conversations: {conversations.length}</p>
            <p>
              Archived Conversations:{" "}
              {conversations.filter((c) => c.is_archived).length}
            </p>
            <p>Blocked Users: {blockedUsers.length}</p>
            {testConversation && (
              <p>
                Test Conversation Status:{" "}
                {testConversation.is_archived ? "Archived" : "Active"}
              </p>
            )}
          </div>
        </div>
      </div>

      <BlockedUsersModal
        isOpen={showBlockedUsers}
        onClose={() => setShowBlockedUsers(false)}
      />

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTest}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
