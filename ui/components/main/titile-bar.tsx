"use client";
import { useEffect } from "react";
import { useTitleBarStore } from "../store/titlebar-store";
import { NotificationPopover } from "../notifications/notification-popover";

const TitileBar = () => {
  const { title, setTitle } = useTitleBarStore();
  useEffect(() => {
    setTitle("Choas");
  }, []);

  return (
    <div className="border-b border-border text-center p-2 w-full relative h-10 flex items-center justify-between">
      <div className="flex-1" />
      <div className="font-medium">{title}</div>
      <div className="flex-1 flex justify-end">
        <NotificationPopover />
      </div>
    </div>
  );
};

export default TitileBar;
