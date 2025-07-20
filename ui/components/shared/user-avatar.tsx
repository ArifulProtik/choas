"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User } from "@/lib/schemas/user";
import { UserPresence } from "@/lib/schemas/messaging";
import React from "react";

interface UserAvatarProps {
  user: User;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  userPresence?: UserPresence | null;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = "md",
  showStatus = false,
  userPresence,
  className,
}) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "in_call":
        return "bg-blue-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Avatar className={cn(sizeClasses[size])}>
        <AvatarImage src={user.avatar_url} alt={user.name} />
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>

      {showStatus && (
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
            getStatusColor(userPresence?.status)
          )}
        />
      )}
    </div>
  );
};
