"use client";

import React from "react";
import { Users, Zap, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  isActive?: boolean;
}

interface NavigationSectionProps {
  items?: NavigationItem[];
  activeSection?: string;
  onSectionChange?: (sectionId: string) => void;
}

const defaultNavigationItems: NavigationItem[] = [
  {
    id: "friends",
    label: "Friends",
    icon: Users,
    onClick: () => console.log("Navigate to Friends"),
  },
  {
    id: "nitro",
    label: "Nitro",
    icon: Zap,
    onClick: () => console.log("Navigate to Nitro"),
  },
  {
    id: "shop",
    label: "Shop",
    icon: ShoppingBag,
    onClick: () => console.log("Navigate to Shop"),
  },
];

export const NavigationSection: React.FC<NavigationSectionProps> = ({
  items = defaultNavigationItems,
  activeSection,
  onSectionChange,
}) => {
  const handleItemClick = (item: NavigationItem) => {
    item.onClick();
    onSectionChange?.(item.id);
  };

  return (
    <div className="px-2 py-2">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id || item.isActive;

        return (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
