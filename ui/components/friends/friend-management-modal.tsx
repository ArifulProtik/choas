"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationBadge } from "@/components/shared/notification-badge";
import { FriendList } from "./friend-list";
import { FriendRequests } from "./friend-requests";
import { useMessagingStore } from "@/components/store/messaging-store";
import { Users, UserPlus } from "lucide-react";

interface FriendManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartConversation?: (userId: string) => void;
  onStartCall?: (userId: string) => void;
}

export function FriendManagementModal({
  open,
  onOpenChange,
  onStartConversation,
  onStartCall,
}: FriendManagementModalProps) {
  const [activeTab, setActiveTab] = useState("friends");

  const { getFriendsList, getPendingFriendRequests, getSentFriendRequests } =
    useMessagingStore();

  const friends = getFriendsList();
  const receivedRequests = getPendingFriendRequests();
  const sentRequests = getSentFriendRequests();
  const totalRequests = receivedRequests.length + sentRequests.length;

  const handleStartConversation = (userId: string) => {
    onStartConversation?.(userId);
    onOpenChange(false);
  };

  const handleStartCall = (userId: string) => {
    onStartCall?.(userId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Friends</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Friends
              {friends.length > 0 && (
                <NotificationBadge
                  count={friends.length}
                  size="sm"
                  variant="default"
                />
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Requests
              {totalRequests > 0 && (
                <NotificationBadge
                  count={totalRequests}
                  size="sm"
                  variant="destructive"
                />
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent
              value="friends"
              className="h-full overflow-y-auto mt-4 pr-2"
            >
              <FriendList
                onStartConversation={handleStartConversation}
                onStartCall={handleStartCall}
              />
            </TabsContent>

            <TabsContent
              value="requests"
              className="h-full overflow-y-auto mt-4 pr-2"
            >
              <FriendRequests />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
