import { ConversationList } from "@/components/messaging/conversation-list";
import React from "react";

const layout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <div className="w-80 flex-shrink-0 border-r border-border">
        <ConversationList />
      </div>
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export default layout;
