"use client";

import React from "react";
import { Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useCallStore } from "@/components/store/call-store";
import { cn } from "@/lib/utils";

export interface IncomingCallModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  isOpen,
  onAccept,
  onDecline,
}) => {
  const { incomingCall, callStatus } = useCallStore();

  if (!isOpen || !incomingCall) return null;

  const caller = incomingCall.caller;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <Card className="w-full max-w-sm mx-4 p-8 text-center">
        <div className="mb-6">
          <div className="relative mb-4">
            <UserAvatar user={caller} size="lg" className="mx-auto" />
            {/* Pulsing ring animation for incoming call */}
            <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-75" />
            <div className="absolute inset-0 rounded-full border-2 border-green-500 animate-pulse" />
          </div>

          <h2 className="text-xl font-semibold mb-1">{caller.name}</h2>
          <p className="text-sm text-muted-foreground mb-2">
            @{caller.username}
          </p>
          <p className="text-sm text-muted-foreground">
            {callStatus === "ringing" ? "Incoming call..." : "Connecting..."}
          </p>
        </div>

        <div className="flex justify-center gap-8">
          {/* Decline button */}
          <Button
            variant="destructive"
            size="lg"
            className={cn(
              "h-14 w-14 rounded-full p-0",
              "bg-red-500 hover:bg-red-600",
              "shadow-lg hover:shadow-xl",
              "transition-all duration-200"
            )}
            onClick={onDecline}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>

          {/* Accept button */}
          <Button
            variant="default"
            size="lg"
            className={cn(
              "h-14 w-14 rounded-full p-0",
              "bg-green-500 hover:bg-green-600",
              "shadow-lg hover:shadow-xl",
              "transition-all duration-200"
            )}
            onClick={onAccept}
          >
            <Phone className="h-6 w-6" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Voice call • Tap to answer
        </p>
      </Card>
    </div>
  );
};
