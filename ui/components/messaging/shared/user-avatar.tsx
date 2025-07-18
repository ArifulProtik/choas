"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/lib/schemas/user";
import { UserPresence } from "@/lib/schemas/messaging";
import { getStatusColor } from "@/lib/utils/messaging-utils";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: User;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  userPresence?: UserPresence | null;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const statusSizeClasses = {
  sm: "w-2.5 h-2.5 -bottom-0.5 -right-0.5",
  md: "w-3 h-3 -bottom-0.5 -right-0.5",
  lg: "w-3.5 h-3.5 -bottom-0.5 -right-0.5",
};

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = "md",
  showStatus = false,
  userPresence,
  className,
}) => {
  const avatarClass = cn(sizeClasses[size], className);
  const statusClass = cn(
    "absolute rounded-full border-2 border-background",
    statusSizeClasses[size],
    showStatus && userPresence
      ? getStatusColor(userPresence.status)
      : "bg-gray-400"
  );

  return (
    <div className="relative">
      <Avatar className={avatarClass}>
        <AvatarImage src={user.avatar_url} alt={user.name} />
        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>

      {showStatus && <div className={statusClass} />}
    </div>
  );
};
