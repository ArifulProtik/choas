"use client";

import React from "react";
import { useCallStore } from "@/components/store/call-store";
import { IncomingCallModal } from "./incoming-call-modal";
import { ActiveCallInterface } from "./active-call-interface";

/**
 * Global call interface component that handles incoming calls and active calls
 * This should be mounted at the app level to handle calls from anywhere
 */
export const GlobalCallInterface: React.FC = () => {
  const {
    showIncomingCallModal,
    isInCall,
    acceptCall,
    declineCall,
    endCall,
    incomingCall,
  } = useCallStore();

  const handleAcceptCall = () => {
    if (incomingCall) {
      acceptCall(incomingCall.id);
    }
  };

  const handleDeclineCall = () => {
    if (incomingCall) {
      declineCall(incomingCall.id);
    }
  };

  const handleEndCall = () => {
    endCall();
  };

  return (
    <>
      {/* Incoming Call Modal */}
      <IncomingCallModal
        isOpen={showIncomingCallModal}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
      />

      {/* Active Call Interface */}
      <ActiveCallInterface isOpen={isInCall()} onEndCall={handleEndCall} />
    </>
  );
};
