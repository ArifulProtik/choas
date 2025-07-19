"use client";

import React from "react";
import { UserPresence } from "@/lib/schemas/messaging";
import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: UserPresence["status"];
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const statusConfig = {
  online: {
    color: "bg-green-500",
    text: "Online",
    textColor: "text-green-600",
  },
  away: {
    color: "bg-yellow-500",
    text: "Away",
    textColor: "text-yellow-600",
  },
  in_call: {
    color: "bg-blue-500",
    text: "In call",
    textColor: "text-blue-600",
  },
  offline: {
    color: "bg-gray-400",
    text: "Offline",
    textColor: "text-gray-500",
  },
};

const sizeClasses = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4",
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = "md",
  showText = false,
  className,
}) => {
  const config = statusConfig[status] || statusConfig.offline;

  if (showText) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn("rounded-full", sizeClasses[size], config.color)} />
        <span className={cn("text-sm", config.textColor)}>{config.text}</span>
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-full", sizeClasses[size], config.color, className)}
      title={config.text}
    />
  );
};
