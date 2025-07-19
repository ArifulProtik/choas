"use client";

import { useState } from "react";
import { User } from "@/lib/schemas/user";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { useMessagingStore } from "@/components/store/messaging-store";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, MessageCircle, Phone, UserMinus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

interface FriendListProps {
  onStartConversation?: (userId: string) => void;
  onStartCall?: (userId: string) => void;
}

export function FriendList({
  onStartConversation,
  onStartCall,
}: FriendListProps) {
  const [removingFriend, setRemovingFriend] = useState<User | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const {
    getFriendsList,
    getUserPresence,
    removeFriendship,
    friendships,
    currentUserId,
  } = useMessagingStore();

  const friends = getFriendsList();

  const handleRemoveFriend = async (friend: User) => {
    if (!currentUserId) return;

    setIsRemoving(true);
    try {
      // Find the friendship to remove
      const friendship = friendships.find(
        (f) =>
          (f.user1.id === currentUserId && f.user2.id === friend.id) ||
          (f.user2.id === currentUserId && f.user1.id === friend.id)
      );

      if (friendship) {
        removeFriendship(friendship.id);
      }
    } catch (error) {
      console.error("Failed to remove friend:", error);
    } finally {
      setIsRemoving(false);
      setRemovingFriend(null);
    }
  };

  const getStatusText = (userId: string) => {
    const presence = getUserPresence(userId);
    if (!presence) return "Offline";

    switch (presence.status) {
      case "online":
        return "Online";
      case "away":
        return "Away";
      case "in_call":
        return "In call";
      default:
        return "Offline";
    }
  };

  if (friends.length === 0) {
    return (
      <EmptyState
        icon={<MessageCircle className="w-8 h-8" />}
        title="No friends yet"
        description="Start by searching for users and sending friend requests"
      />
    );
  }

  return (
    <>
      <div className="space-y-2">
        {friends.map((friend) => (
          <div
            key={friend.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <UserAvatar
                user={friend}
                size="md"
                showStatus
                userPresence={getUserPresence(friend.id)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{friend.name}</p>
                <p className="text-xs text-muted-foreground">
                  @{friend.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getStatusText(friend.id)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStartConversation?.(friend.id)}
                className="h-8 w-8 p-0"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStartCall?.(friend.id)}
                className="h-8 w-8 p-0"
                disabled={getUserPresence(friend.id)?.status === "in_call"}
              >
                <Phone className="w-4 h-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setRemovingFriend(friend)}
                    className="text-destructive focus:text-destructive"
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    Remove Friend
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={removingFriend !== null}
        onOpenChange={() => setRemovingFriend(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Friend</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {removingFriend?.name} from your
              friends list? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemovingFriend(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                removingFriend && handleRemoveFriend(removingFriend)
              }
              disabled={isRemoving}
              variant="destructive"
            >
              {isRemoving ? "Removing..." : "Remove Friend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
