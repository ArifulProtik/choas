"use client";

import React, { useState, useEffect } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  useCallStore,
  CallConnectionQuality,
} from "@/components/store/call-store";
import { cn } from "@/lib/utils";

export interface ActiveCallInterfaceProps {
  isOpen: boolean;
  onEndCall: () => void;
  onMinimize?: () => void;
}

export const ActiveCallInterface: React.FC<ActiveCallInterfaceProps> = ({
  isOpen,
  onEndCall,
  onMinimize,
}) => {
  const {
    activeCall,
    callStatus,
    audioSettings,
    callMetrics,
    isCallWindowMinimized,
    toggleMute,
    setVolume,
    setCallWindowMinimized,
    getCurrentCallDuration,
    getCallParticipant,
  } = useCallStore();

  const [callDuration, setCallDuration] = useState(0);
  const [showVolumeControl, setShowVolumeControl] = useState(false);

  const participant = getCallParticipant();

  // Update call duration every second
  useEffect(() => {
    if (callStatus === "accepted" && activeCall) {
      const interval = setInterval(() => {
        setCallDuration(getCurrentCallDuration());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [callStatus, activeCall, getCurrentCallDuration]);

  if (!isOpen || !activeCall || !participant) return null;

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getConnectionQualityIcon = (quality: CallConnectionQuality) => {
    switch (quality) {
      case "excellent":
        return <SignalHigh className="h-4 w-4 text-green-500" />;
      case "good":
        return <SignalMedium className="h-4 w-4 text-yellow-500" />;
      case "poor":
        return <SignalLow className="h-4 w-4 text-orange-500" />;
      case "disconnected":
        return <Signal className="h-4 w-4 text-red-500" />;
      default:
        return <Signal className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConnectionQualityText = (quality: CallConnectionQuality) => {
    switch (quality) {
      case "excellent":
        return "Excellent";
      case "good":
        return "Good";
      case "poor":
        return "Poor";
      case "disconnected":
        return "Disconnected";
      default:
        return "Unknown";
    }
  };

  const getCallStatusText = () => {
    switch (callStatus) {
      case "pending":
        return "Calling...";
      case "ringing":
        return "Ringing...";
      case "accepted":
        return formatDuration(callDuration);
      default:
        return "Connecting...";
    }
  };

  // Minimized view
  if (isCallWindowMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <Card className="p-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border shadow-lg">
          <div className="flex items-center gap-3">
            <UserAvatar user={participant} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{participant.name}</p>
              <p className="text-xs text-muted-foreground">
                {getCallStatusText()}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {getConnectionQualityIcon(callMetrics.connectionQuality)}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCallWindowMinimized(false)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onEndCall}
              >
                <PhoneOff className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Full call interface
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 p-8 text-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
        {/* Header with minimize button */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {getConnectionQualityIcon(callMetrics.connectionQuality)}
            <span>
              {getConnectionQualityText(callMetrics.connectionQuality)}
            </span>
          </div>
          {onMinimize && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setCallWindowMinimized(true)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* User info */}
        <div className="mb-8">
          <UserAvatar user={participant} size="lg" className="mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-1">{participant.name}</h2>
          <p className="text-sm text-muted-foreground mb-2">
            @{participant.username}
          </p>
          <p className="text-lg font-mono text-muted-foreground">
            {getCallStatusText()}
          </p>
        </div>

        {/* Call metrics (when available) */}
        {callMetrics.latency && (
          <div className="mb-6 text-xs text-muted-foreground">
            <div className="flex justify-center gap-4">
              {callMetrics.latency && (
                <span>Latency: {callMetrics.latency}ms</span>
              )}
              {callMetrics.packetLoss && (
                <span>Loss: {callMetrics.packetLoss.toFixed(1)}%</span>
              )}
              {callMetrics.bitrate && (
                <span>Bitrate: {Math.round(callMetrics.bitrate)}kbps</span>
              )}
            </div>
          </div>
        )}

        {/* Audio controls */}
        <div className="flex justify-center items-center gap-6 mb-6">
          {/* Mute button */}
          <Button
            variant={audioSettings.isMuted ? "destructive" : "secondary"}
            size="lg"
            className={cn(
              "h-12 w-12 rounded-full p-0",
              "shadow-lg hover:shadow-xl",
              "transition-all duration-200"
            )}
            onClick={toggleMute}
          >
            {audioSettings.isMuted ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>

          {/* Volume control */}
          <div className="relative">
            <Button
              variant="secondary"
              size="lg"
              className={cn(
                "h-12 w-12 rounded-full p-0",
                "shadow-lg hover:shadow-xl",
                "transition-all duration-200"
              )}
              onClick={() => setShowVolumeControl(!showVolumeControl)}
            >
              {audioSettings.volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>

            {/* Volume slider */}
            {showVolumeControl && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2">
                <Card className="p-3 bg-background/95 backdrop-blur">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Volume
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={audioSettings.volume}
                      onChange={(e) => setVolume(parseInt(e.target.value))}
                      className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground">
                      {audioSettings.volume}%
                    </span>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* End call button */}
          <Button
            variant="destructive"
            size="lg"
            className={cn(
              "h-12 w-12 rounded-full p-0",
              "bg-red-500 hover:bg-red-600",
              "shadow-lg hover:shadow-xl",
              "transition-all duration-200"
            )}
            onClick={onEndCall}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>

        {/* Call status indicators */}
        <div className="text-xs text-muted-foreground">
          <div className="flex justify-center items-center gap-2">
            {audioSettings.isMuted && (
              <span className="flex items-center gap-1 text-red-500">
                <MicOff className="h-3 w-3" />
                Muted
              </span>
            )}
            {callStatus === "accepted" && (
              <span className="flex items-center gap-1 text-green-500">
                <Phone className="h-3 w-3" />
                Connected
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
