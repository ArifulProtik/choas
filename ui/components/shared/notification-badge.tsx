"use client";

import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "destructive" | "secondary";
  className?: string;
  showZero?: boolean;
}

export function NotificationBadge({
  count,
  maxCount = 99,
  size = "md",
  variant = "destructive",
  className,
  showZero = false,
}: NotificationBadgeProps) {
  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const sizeClasses = {
    sm: "h-4 w-4 text-xs min-w-[16px]",
    md: "h-5 w-5 text-xs min-w-[20px]",
    lg: "h-6 w-6 text-sm min-w-[24px]",
  };

  const variantClasses = {
    default: "bg-blue-500 text-white",
    destructive: "bg-red-500 text-white",
    secondary: "bg-gray-500 text-white",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {displayCount}
    </div>
  );
}

interface NotificationDotProps {
  visible: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "destructive" | "secondary";
  className?: string;
}

export function NotificationDot({
  visible,
  size = "md",
  variant = "destructive",
  className,
}: NotificationDotProps) {
  if (!visible) {
    return null;
  }

  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  const variantClasses = {
    default: "bg-blue-500",
    destructive: "bg-red-500",
    secondary: "bg-gray-500",
  };

  return (
    <div
      className={cn(
        "rounded-full",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    />
  );
}
