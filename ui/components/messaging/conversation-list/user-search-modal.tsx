"use client";

import React, { useState, useMemo } from "react";
import { Search, Users } from "lucide-react";
import { useMessagingStore } from "@/components/store/messaging-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { FriendManagementModal } from "@/components/friends/friend-management-modal";
import { mockUsers } from "@/lib/mock/messaging-data";
import { SendFriendRequest } from "@/components/friends/send-friend-request";

export interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFriendManagement, setShowFriendManagement] = useState(false);
  const { getFriendsList, currentUserId } = useMessagingStore();

  const friends = getFriendsList();

  // For demo purposes, show all mock users in search results
  const allUsers = mockUsers.filter((user) => user.id !== currentUserId);

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return { friends, allUsers: [] };

    const query = searchQuery.toLowerCase();
    const filteredFriends = friends.filter(
      (friend) =>
        friend.name.toLowerCase().includes(query) ||
        friend.username.toLowerCase().includes(query)
    );

    const filteredAllUsers = allUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query)
    );

    return { friends: filteredFriends, allUsers: filteredAllUsers };
  }, [friends, allUsers, searchQuery]);

  const handleSelectUser = (userId: string) => {
    onSelectUser(userId);
    onClose();
    setSearchQuery(""); // Reset search query when closing
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Start a Conversation</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFriendManagement(true)}
            >
              <Users className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="max-h-64">
          {!searchQuery.trim() ? (
            <div className="space-y-4">
              {/* Friends Section */}
              {filteredResults.friends.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Friends
                  </h3>
                  <div className="space-y-2">
                    {filteredResults.friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => handleSelectUser(friend.id)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={friend.avatar_url}
                            alt={friend.name}
                          />
                          <AvatarFallback className="text-xs">
                            {friend.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{friend.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            @{friend.username}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredResults.friends.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No friends yet</p>
                  <p className="text-xs mt-1">
                    Search for users to add friends
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Friends Results */}
              {filteredResults.friends.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Friends
                  </h3>
                  <div className="space-y-2">
                    {filteredResults.friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => handleSelectUser(friend.id)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={friend.avatar_url}
                            alt={friend.name}
                          />
                          <AvatarFallback className="text-xs">
                            {friend.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{friend.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            @{friend.username}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Users Results */}
              {filteredResults.allUsers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Users
                  </h3>
                  <div className="space-y-2">
                    {filteredResults.allUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url} alt={user.name} />
                          <AvatarFallback className="text-xs">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{user.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            @{user.username}
                          </p>
                        </div>
                        <SendFriendRequest user={user} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredResults.friends.length === 0 &&
                filteredResults.allUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found
                  </div>
                )}
            </div>
          )}
        </ScrollArea>

        <FriendManagementModal
          open={showFriendManagement}
          onOpenChange={setShowFriendManagement}
          onStartConversation={handleSelectUser}
        />
      </Card>
    </div>
  );
};
