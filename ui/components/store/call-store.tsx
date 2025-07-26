"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Call, CallStatus, CallType } from "@/lib/schemas/messaging";
import { User } from "@/lib/schemas/user";
import { isWebSocketMessageDuplicate } from "@/lib/utils/websocket-deduplication";

// Call state interfaces
export type CallConnectionQuality =
  | "excellent"
  | "good"
  | "poor"
  | "disconnected";

export interface AudioSettings {
  isMuted: boolean;
  volume: number; // 0-100
  inputVolume: number; // 0-100
  outputDevice?: string;
  inputDevice?: string;
}

export interface CallMetrics {
  connectionQuality: CallConnectionQuality;
  latency?: number; // in ms
  packetLoss?: number; // percentage
  bitrate?: number; // kbps
}

// Store state interface
interface CallState {
  // Active call state
  activeCall: Call | null;
  incomingCall: Call | null;
  callStatus: CallStatus | "idle";

  // Audio control state
  audioSettings: AudioSettings;
  callMetrics: CallMetrics;

  // UI state
  isCallWindowMinimized: boolean;
  showIncomingCallModal: boolean;

  // Loading states
  isInitiatingCall: boolean;
  isConnecting: boolean;

  // Error state
  callError: string | null;

  // Call history (recent calls for quick access)
  recentCalls: Call[];

  // Actions
  // Call lifecycle actions
  initiateCall: (calleeId: string, callType?: CallType) => void;
  setIncomingCall: (call: Call | null) => void;
  acceptCall: (callId: string) => void;
  declineCall: (callId: string) => void;
  endCall: () => void;

  // Call state management
  setActiveCall: (call: Call | null) => void;
  setCallStatus: (status: CallStatus | "idle") => void;
  updateCallDuration: (duration: number) => void;

  // Audio control actions
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  setInputVolume: (volume: number) => void;
  setAudioDevice: (type: "input" | "output", deviceId: string) => void;

  // Connection quality actions
  updateConnectionQuality: (quality: CallConnectionQuality) => void;
  updateCallMetrics: (metrics: Partial<CallMetrics>) => void;

  // UI actions
  setCallWindowMinimized: (minimized: boolean) => void;
  setShowIncomingCallModal: (show: boolean) => void;

  // Loading and error actions
  setInitiatingCall: (initiating: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setCallError: (error: string | null) => void;

  // Call history actions
  addToRecentCalls: (call: Call) => void;
  clearRecentCalls: () => void;

  // Computed getters
  isInCall: () => boolean;
  canInitiateCall: () => boolean;
  getCurrentCallDuration: () => number;
  getCallParticipant: () => User | null;

  // WebSocket integration
  handleWebSocketMessage: (message: any) => void;

  // Cleanup and reset
  reset: () => void;
  cleanup: () => void;
}

const initialAudioSettings: AudioSettings = {
  isMuted: false,
  volume: 80,
  inputVolume: 80,
  outputDevice: undefined,
  inputDevice: undefined,
};

const initialCallMetrics: CallMetrics = {
  connectionQuality: "excellent",
  latency: undefined,
  packetLoss: undefined,
  bitrate: undefined,
};

const initialState = {
  // Active call state
  activeCall: null,
  incomingCall: null,
  callStatus: "idle" as const,

  // Audio control state
  audioSettings: initialAudioSettings,
  callMetrics: initialCallMetrics,

  // UI state
  isCallWindowMinimized: false,
  showIncomingCallModal: false,

  // Loading states
  isInitiatingCall: false,
  isConnecting: false,

  // Error state
  callError: null,

  // Call history
  recentCalls: [],
};

export const useCallStore = create<CallState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Call lifecycle actions
    initiateCall: (calleeId: string, callType: CallType = "voice") => {
      const state = get();

      // Prevent initiating call if already in a call
      if (state.activeCall || state.incomingCall) {
        set({ callError: "Cannot initiate call while already in a call" });
        return;
      }

      // Create a temporary call object for UI purposes
      // The actual call will be created by the backend
      const tempCall: Call = {
        id: `temp-${Date.now()}`,
        caller: { id: "current-user" } as User, // Will be replaced with actual user
        callee: { id: calleeId } as User, // Will be replaced with actual user
        type: callType,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      set({
        activeCall: tempCall,
        callStatus: "pending",
        isInitiatingCall: true,
        callError: null,
      });
    },

    setIncomingCall: (call: Call | null) => {
      const state = get();

      // If already in a call, automatically decline the incoming call
      if (state.activeCall && call) {
        // This would trigger a decline action to the backend
        return;
      }

      if (call) {
        set({
          incomingCall: call,
          showIncomingCallModal: true,
          callStatus: "ringing",
          callError: null,
        });
      } else {
        set({
          incomingCall: null,
          showIncomingCallModal: false,
          callStatus: "idle",
          callError: null,
        });
      }
    },

    acceptCall: (callId: string) => {
      const state = get();

      if (state.incomingCall?.id === callId) {
        set({
          activeCall: state.incomingCall,
          incomingCall: null,
          showIncomingCallModal: false,
          callStatus: "accepted",
          isConnecting: true,
          callError: null,
        });
      }
    },

    declineCall: (callId: string) => {
      const state = get();

      if (state.incomingCall?.id === callId) {
        // Add to recent calls before clearing
        if (state.incomingCall) {
          get().addToRecentCalls({
            ...state.incomingCall,
            status: "declined",
            ended_at: new Date().toISOString(),
          });
        }

        set({
          incomingCall: null,
          showIncomingCallModal: false,
          callStatus: "idle",
          callError: null,
        });
      }
    },

    endCall: () => {
      const state = get();

      if (state.activeCall) {
        // Add to recent calls before clearing
        get().addToRecentCalls({
          ...state.activeCall,
          status: "ended",
          ended_at: new Date().toISOString(),
          duration: get().getCurrentCallDuration(),
        });

        set({
          activeCall: null,
          callStatus: "idle",
          isConnecting: false,
          isCallWindowMinimized: false,
          audioSettings: initialAudioSettings,
          callMetrics: initialCallMetrics,
          callError: null,
        });
      }
    },

    // Call state management
    setActiveCall: (call: Call | null) => {
      set({ activeCall: call });
    },

    setCallStatus: (status: CallStatus | "idle") => {
      set({ callStatus: status });

      // Update connecting state based on status
      if (status === "accepted") {
        set({ isConnecting: true });
      } else if (
        status === "ended" ||
        status === "declined" ||
        status === "failed"
      ) {
        set({ isConnecting: false, isInitiatingCall: false });
      }
    },

    updateCallDuration: (duration: number) => {
      const state = get();
      if (state.activeCall) {
        set({
          activeCall: {
            ...state.activeCall,
            duration,
          },
        });
      }
    },

    // Audio control actions
    toggleMute: () => {
      const state = get();
      set({
        audioSettings: {
          ...state.audioSettings,
          isMuted: !state.audioSettings.isMuted,
        },
      });
    },

    setMuted: (muted: boolean) => {
      const state = get();
      set({
        audioSettings: {
          ...state.audioSettings,
          isMuted: muted,
        },
      });
    },

    setVolume: (volume: number) => {
      const state = get();
      const clampedVolume = Math.max(0, Math.min(100, volume));
      set({
        audioSettings: {
          ...state.audioSettings,
          volume: clampedVolume,
        },
      });
    },

    setInputVolume: (volume: number) => {
      const state = get();
      const clampedVolume = Math.max(0, Math.min(100, volume));
      set({
        audioSettings: {
          ...state.audioSettings,
          inputVolume: clampedVolume,
        },
      });
    },

    setAudioDevice: (type: "input" | "output", deviceId: string) => {
      const state = get();
      set({
        audioSettings: {
          ...state.audioSettings,
          [type === "input" ? "inputDevice" : "outputDevice"]: deviceId,
        },
      });
    },

    // Connection quality actions
    updateConnectionQuality: (quality: CallConnectionQuality) => {
      const state = get();
      set({
        callMetrics: {
          ...state.callMetrics,
          connectionQuality: quality,
        },
      });
    },

    updateCallMetrics: (metrics: Partial<CallMetrics>) => {
      const state = get();
      set({
        callMetrics: {
          ...state.callMetrics,
          ...metrics,
        },
      });
    },

    // UI actions
    setCallWindowMinimized: (minimized: boolean) => {
      set({ isCallWindowMinimized: minimized });
    },

    setShowIncomingCallModal: (show: boolean) => {
      set({ showIncomingCallModal: show });
    },

    // Loading and error actions
    setInitiatingCall: (initiating: boolean) => {
      set({ isInitiatingCall: initiating });
    },

    setConnecting: (connecting: boolean) => {
      set({ isConnecting: connecting });
    },

    setCallError: (error: string | null) => {
      set({ callError: error });
    },

    // Call history actions
    addToRecentCalls: (call: Call) => {
      const state = get();
      const updatedRecentCalls = [call, ...state.recentCalls.slice(0, 9)]; // Keep last 10 calls
      set({ recentCalls: updatedRecentCalls });
    },

    clearRecentCalls: () => {
      set({ recentCalls: [] });
    },

    // Computed getters
    isInCall: () => {
      const state = get();
      return (
        state.activeCall !== null &&
        (state.callStatus === "accepted" || state.callStatus === "ringing")
      );
    },

    canInitiateCall: () => {
      const state = get();
      return (
        !state.activeCall &&
        !state.incomingCall &&
        !state.isInitiatingCall &&
        state.callStatus === "idle"
      );
    },

    getCurrentCallDuration: () => {
      const state = get();
      if (!state.activeCall?.started_at) return 0;

      const startTime = new Date(state.activeCall.started_at).getTime();
      const currentTime = Date.now();
      return Math.floor((currentTime - startTime) / 1000); // Duration in seconds
    },

    getCallParticipant: () => {
      const state = get();
      const call = state.activeCall || state.incomingCall;
      if (!call) return null;

      // Return the other participant (not the current user)
      // This logic would need to be updated based on how current user is identified
      return call.caller.id === "current-user" ? call.callee : call.caller;
    },

    // WebSocket message handler - matches backend call signaling patterns
    handleWebSocketMessage: (message: any) => {
      if (!message.type || !message.data) {
        console.warn("Invalid WebSocket call message format:", message);
        return;
      }

      const timestamp = message.timestamp || new Date().toISOString();

      // Check for duplicate messages using backend message ID and timestamp patterns
      if (isWebSocketMessageDuplicate(message.type, message.data, timestamp)) {
        console.log(
          "Duplicate WebSocket call message detected, skipping:",
          message.type
        );
        return;
      }

      switch (message.type) {
        case "call_request":
          // Handle incoming call request matching backend CallRequestData structure
          if (
            message.data.call_id &&
            message.data.caller_id &&
            message.data.callee_id &&
            message.data.call_type
          ) {
            const state = get();

            // Only handle if call is for current user and not already in a call
            const currentUserId = "current-user"; // This should come from auth store
            if (message.data.callee_id === currentUserId && !state.activeCall) {
              const incomingCall: Call = {
                id: message.data.call_id,
                caller: {
                  id: message.data.caller_id,
                  name: "Caller", // Would be populated from user data in real implementation
                  username: "caller",
                  email: "",
                  created_at: timestamp,
                  updated_at: timestamp,
                },
                callee: {
                  id: message.data.callee_id,
                  name: "Callee", // Would be populated from user data in real implementation
                  username: "callee",
                  email: "",
                  created_at: timestamp,
                  updated_at: timestamp,
                },
                type: (message.data.call_type as CallType) || "voice",
                status: "ringing",
                created_at: timestamp,
                updated_at: timestamp,
              };

              get().setIncomingCall(incomingCall);
            }
          }
          break;

        case "call_response":
          // Handle call response matching backend CallResponseData structure
          if (
            message.data.call_id &&
            message.data.response &&
            message.data.caller_id &&
            message.data.callee_id
          ) {
            const state = get();

            // Handle response for active call
            if (state.activeCall?.id === message.data.call_id) {
              if (message.data.response === "accepted" && state.activeCall) {
                get().setCallStatus("accepted");
                set({
                  activeCall: {
                    ...state.activeCall,
                    status: "accepted",
                    answered_at: timestamp,
                    started_at: timestamp, // Call starts when accepted
                  },
                  isConnecting: false,
                  isInitiatingCall: false,
                });
              } else if (message.data.response === "declined") {
                get().setCallStatus("declined");

                // Add to recent calls and clear active call
                if (state.activeCall) {
                  get().addToRecentCalls({
                    ...state.activeCall,
                    status: "declined",
                    ended_at: timestamp,
                  });
                }

                set({
                  activeCall: null,
                  callStatus: "idle",
                  isInitiatingCall: false,
                  isConnecting: false,
                  callError: null,
                });
              }
            }
          }
          break;

        case "call_end":
          // Handle call end matching backend CallEndData structure
          if (
            message.data.call_id &&
            message.data.caller_id &&
            message.data.callee_id
          ) {
            const state = get();

            // Check if this call end is for current user's call
            if (
              state.activeCall?.id === message.data.call_id ||
              state.incomingCall?.id === message.data.call_id
            ) {
              const callToEnd = state.activeCall || state.incomingCall;

              if (callToEnd) {
                // Add to recent calls with proper duration
                get().addToRecentCalls({
                  ...callToEnd,
                  status: "ended",
                  ended_at: timestamp,
                  duration: message.data.duration || 0,
                });
              }

              // Clear all call state
              set({
                activeCall: null,
                incomingCall: null,
                callStatus: "idle",
                showIncomingCallModal: false,
                isInitiatingCall: false,
                isConnecting: false,
                isCallWindowMinimized: false,
                audioSettings: initialAudioSettings,
                callMetrics: initialCallMetrics,
                callError: null,
              });
            }
          }
          break;

        default:
          // Log unhandled message types for debugging
          console.log(
            "Unhandled WebSocket message type in CallStore:",
            message.type
          );
          break;
      }
    },

    // Cleanup and reset
    reset: () => {
      set(initialState);
    },

    cleanup: () => {
      const state = get();

      // End any active call
      if (state.activeCall) {
        get().endCall();
      }

      // Clear incoming call
      if (state.incomingCall) {
        set({
          incomingCall: null,
          showIncomingCallModal: false,
        });
      }

      // Reset to initial state
      set({
        callStatus: "idle",
        isInitiatingCall: false,
        isConnecting: false,
        callError: null,
        audioSettings: initialAudioSettings,
        callMetrics: initialCallMetrics,
        isCallWindowMinimized: false,
      });
    },
  }))
);
