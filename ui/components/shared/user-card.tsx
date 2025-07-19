"use client";

import React from "react";
import { User } from "@/lib/schemas/user";
import { UserPresence } from "@/lib/schemas/messaging";
import { UserAvatar } from "./user-avatar";
import { NotificationBadge } from "./notification-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MessageCircle,
  Phone,
  UserPlus,
  UserCheck,
  UserMinus,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserCardAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?:
    | "default"
    | "outline"
    | "destructive"
    | "secondary"
    | "ghost"
    | "link";
  disabled?: boolean;
}

interface UserCardBadge {
  label: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  icon?: React.ReactNode;
}

interface UserCardProps {
  user: User;
  userPresence?: UserPresence | null;
  variant?: "compact" | "card" | "list";
  showStatus?: boolean;
  showLastSeen?: boolean;
  badges?: UserCardBadge[];
  primaryActions?: UserCardAction[];
  secondaryActions?: UserCardAction[];
  unreadCount?: number;
  subtitle?: string;
  description?: string;
  onClick?: () => void;
  className?: string;
}

const getStatusText = (presence: UserPresence | null | undefined): string => {
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

export const UserCard: React.FC<UserCardProps> = ({
  user,
  userPresence,
  variant = "list",
  showStatus = false,
  showLastSeen = false,
  badges = [],
  primaryActions = [],
  secondaryActions = [],
  unreadCount = 0,
  subtitle,
  description,
  onClick,
  className,
}) => {
  const statusText = getStatusText(userPresence);
  const displaySubtitle = subtitle || `@${user.username}`;

  const renderContent = () => (
    <>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative">
          <UserAvatar
            user={user}
            size={variant === "compact" ? "sm" : "md"}
            showStatus={showStatus}
            userPresence={userPresence}
          />
          {unreadCount > 0 && (
            <NotificationBadge
              count={unreadCount}
              size="sm"
              className="absolute -top-1 -right-1"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className={cn(
                "font-medium truncate",
                variant === "compact" ? "text-sm" : "text-base"
              )}
            >
              {user.name}
            </h4>
            {badges.map((badge, index) => (
              <Badge key={index} variant={badge.variant} className="text-xs">
                {badge.icon && <span className="mr-1">{badge.icon}</span>}
                {badge.label}
              </Badge>
            ))}
          </div>

          <p
            className={cn(
              "text-muted-foreground truncate",
              variant === "compact" ? "text-xs" : "text-sm"
            )}
          >
            {displaySubtitle}
          </p>

          {(showStatus || showLastSeen) && (
            <p className="text-xs text-muted-foreground">
              {statusText}
              {showLastSeen && userPresence?.last_seen && (
                <span>
                  {" "}
                  • Last seen{" "}
                  {new Date(userPresence.last_seen).toLocaleDateString()}
                </span>
              )}
            </p>
          )}

          {description && variant !== "compact" && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {(primaryActions.length > 0 || secondaryActions.length > 0) && (
        <div className="flex items-center gap-2">
          {primaryActions.map((action, index) => (
            <Button
              key={index}
              size={variant === "compact" ? "sm" : "default"}
              variant={action.variant || "default"}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              disabled={action.disabled}
              className={cn(
                "flex items-center gap-1",
                variant === "compact" && "h-8 px-2"
              )}
            >
              {action.icon}
              {variant !== "compact" && action.label}
            </Button>
          ))}

          {secondaryActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size={variant === "compact" ? "sm" : "default"}
                  className={cn(
                    "p-0",
                    variant === "compact" ? "h-8 w-8" : "h-10 w-10"
                  )}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {secondaryActions.map((action, index) => (
                  <React.Fragment key={index}>
                    <DropdownMenuItem
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={cn(
                        action.variant === "destructive" &&
                          "text-destructive focus:text-destructive"
                      )}
                    >
                      {action.icon && (
                        <span className="mr-2">{action.icon}</span>
                      )}
                      {action.label}
                    </DropdownMenuItem>
                    {index < secondaryActions.length - 1 &&
                      action.variant === "destructive" && (
                        <DropdownMenuSeparator />
                      )}
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </>
  );

  if (variant === "card") {
    return (
      <Card
        className={cn(
          "p-4 hover:shadow-md transition-shadow",
          onClick && "cursor-pointer",
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          {renderContent()}
        </div>
      </Card>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {renderContent()}
    </div>
  );
};

// Preset configurations for common use cases
export const FriendCard: React.FC<
  Omit<UserCardProps, "primaryActions" | "secondaryActions"> & {
    onMessage?: () => void;
    onCall?: () => void;
    onRemove?: () => void;
    canCall?: boolean;
  }
> = ({ onMessage, onCall, onRemove, canCall = true, ...props }) => {
  const primaryActions: UserCardAction[] = [];
  const secondaryActions: UserCardAction[] = [];

  if (onMessage) {
    primaryActions.push({
      label: "Message",
      icon: <MessageCircle className="w-4 h-4" />,
      onClick: onMessage,
      variant: "ghost",
    });
  }

  if (onCall && canCall) {
    primaryActions.push({
      label: "Call",
      icon: <Phone className="w-4 h-4" />,
      onClick: onCall,
      variant: "ghost",
    });
  }

  if (onRemove) {
    secondaryActions.push({
      label: "Remove Friend",
      icon: <UserMinus className="w-4 h-4" />,
      onClick: onRemove,
      variant: "destructive",
    });
  }

  return (
    <UserCard
      {...props}
      primaryActions={primaryActions}
      secondaryActions={secondaryActions}
      showStatus
    />
  );
};

export const SearchResultCard: React.FC<
  Omit<UserCardProps, "primaryActions" | "secondaryActions"> & {
    onMessage?: () => void;
    onAddFriend?: () => void;
    onViewProfile?: () => void;
    onBlock?: () => void;
    isFriend?: boolean;
    hasConversation?: boolean;
    isBlocked?: boolean;
  }
> = ({
  onMessage,
  onAddFriend,
  onViewProfile,
  onBlock,
  isFriend,
  hasConversation,
  isBlocked,
  ...props
}) => {
  const badges: UserCardBadge[] = [];
  const primaryActions: UserCardAction[] = [];
  const secondaryActions: UserCardAction[] = [];

  if (isFriend) {
    badges.push({
      label: "Friend",
      variant: "secondary",
      icon: <UserCheck className="h-3 w-3" />,
    });
  }

  if (hasConversation) {
    badges.push({
      label: "Chat",
      variant: "outline",
      icon: <MessageCircle className="h-3 w-3" />,
    });
  }

  if (isBlocked) {
    badges.push({
      label: "Blocked",
      variant: "destructive",
      icon: <UserMinus className="h-3 w-3" />,
    });
  }

  if (onMessage) {
    primaryActions.push({
      label: "Message",
      icon: <MessageCircle className="w-4 h-4" />,
      onClick: onMessage,
      disabled: isBlocked,
    });
  }

  if (onAddFriend && !isFriend && !isBlocked) {
    primaryActions.push({
      label: "Add Friend",
      icon: <UserPlus className="w-4 h-4" />,
      onClick: onAddFriend,
      variant: "outline",
    });
  }

  if (onViewProfile) {
    secondaryActions.push({
      label: "View Profile",
      icon: <UserCheck className="w-4 h-4" />,
      onClick: onViewProfile,
    });
  }

  if (onBlock) {
    secondaryActions.push({
      label: "Block User",
      icon: <UserMinus className="w-4 h-4" />,
      onClick: onBlock,
      variant: "destructive",
    });
  }

  return (
    <UserCard
      {...props}
      badges={badges}
      primaryActions={primaryActions}
      secondaryActions={secondaryActions}
      variant="card"
      showStatus
    />
  );
};
