"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { useMessagingStore } from "@/components/store/messaging-store";
import { useAuthStore } from "@/components/store/auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getStatusColor } from "@/lib/utils/messaging-utils";
import { User } from "@/lib/schemas/user";
import { cn } from "@/lib/utils";

interface UserProfileProps {
  user: User;
  onClose?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const { user: currentUser } = useAuthStore();
  const { getUserPresence } = useMessagingStore();

  if (!currentUser) return null;

  const userPresence = getUserPresence(user.id);

  // TODO: Replace with actual mutual friends data from backend
  const mutualFriendsCount = 0; // Will be populated from backend
  const mutualServersCount = 0; // Servers not used in private messaging app

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getJoinDate = () => {
    const joinDate = new Date(user.created_at);
    return joinDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleViewFullProfile = () => {
    console.log("View full profile for:", user.id);
  };

  const handleMutualServers = () => {
    console.log("View mutual servers for:", user.id);
  };

  const handleMutualFriends = () => {
    console.log("View mutual friends for:", user.id);
  };

  return (
    <div className="w-full bg-background flex flex-col h-full border-l border-border">
      {/* Cover Image */}
      <div className="relative h-24">
        {user.cover_url ? (
          <img
            src={user.cover_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600" />
        )}
      </div>

      <div className="flex-1 px-4 pb-4">
        {/* User Avatar - Positioned over cover */}
        <div className="flex justify-center -mt-10 mb-6 z-10">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-background">
              <AvatarImage src={user.avatar_url} alt={user.name} />
              <AvatarFallback className="bg-muted text-foreground font-semibold text-xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>

            {/* Status indicator */}
            <div
              className={cn(
                "absolute bottom-0 right-0 w-6 h-6 rounded-full border-4 border-background",
                getStatusColor(userPresence?.status || "offline")
              )}
            />
          </div>
        </div>

        {/* User Info */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-semibold text-foreground">
              {user.name}
            </h2>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
            {user.username} • {user.pronouns || "he/him"}
          </div>
        </div>

        {/* About Me Section */}
        {user.bio && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground mb-3">
              About Me
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {user.bio}
            </p>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">
                Member Since
              </h4>
              <p className="text-sm text-muted-foreground">{getJoinDate()}</p>
            </div>
          </div>
        )}

        {/* Mutual Connections */}
        <div className="space-y-2">
          <button
            onClick={handleMutualServers}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group"
          >
            <span className="text-sm font-medium text-foreground">
              Mutual Servers — {mutualServersCount}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>

          <button
            onClick={handleMutualFriends}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group"
          >
            <span className="text-sm font-medium text-foreground">
              Mutual Friends — {mutualFriendsCount}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </div>
      </div>

      {/* Footer - View Full Profile Button */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={handleViewFullProfile}
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground"
        >
          View Full Profile
        </Button>
      </div>
    </div>
  );
};
