import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { CallsApiService } from "../api/calls";
import { useCallStore } from "@/components/store/call-store";
import { Call, CallType } from "../schemas/messaging";
import { toast } from "sonner";

// Query keys for call-related queries
export const callQueryKeys = {
  all: ["calls"] as const,
  active: () => [...callQueryKeys.all, "active"] as const,
  history: () => [...callQueryKeys.all, "history"] as const,
  historyWithParams: (params: { limit?: number; offset?: number }) =>
    [...callQueryKeys.history(), params] as const,
};

/**
 * Hook to get the current user's active call
 */
export const useActiveCall = () => {
  const { setActiveCall, setCallStatus } = useCallStore();

  const query = useQuery({
    queryKey: callQueryKeys.active(),
    queryFn: async () => {
      const response = await CallsApiService.getActiveCall();
      return response;
    },
    select: (data) => data.active_call,
    refetchInterval: 5000, // Poll every 5 seconds for active call status
    staleTime: 1000, // Consider data stale after 1 second
  });

  // Handle side effects with useEffect
  useEffect(() => {
    if (query.isSuccess) {
      const activeCall = query.data;
      if (activeCall) {
        setActiveCall(activeCall);
        setCallStatus(activeCall.status);
      } else {
        setActiveCall(null);
        setCallStatus("idle");
      }
    }
  }, [query.isSuccess, query.data, setActiveCall, setCallStatus]);

  useEffect(() => {
    if (query.isError) {
      console.error("Failed to fetch active call:", query.error);
      toast.error("Failed to check active call status");
    }
  }, [query.isError, query.error]);

  return query;
};

/**
 * Hook to initiate a new call
 */
export const useInitiateCall = () => {
  const queryClient = useQueryClient();
  const {
    setActiveCall,
    setCallStatus,
    setInitiatingCall,
    setCallError,
    canInitiateCall,
  } = useCallStore();

  return useMutation({
    mutationFn: async ({
      calleeId,
      callType = "voice",
    }: {
      calleeId: string;
      callType?: CallType;
    }) => {
      // Check if we can initiate a call
      if (!canInitiateCall()) {
        throw new Error("Cannot initiate call while already in a call");
      }

      return await CallsApiService.initiateCall({
        callee_id: calleeId,
        call_type: callType,
      });
    },
    onMutate: ({ calleeId, callType = "voice" }) => {
      // Set loading state
      setInitiatingCall(true);
      setCallError(null);

      // Create optimistic call object
      const optimisticCall: Call = {
        id: `temp-${Date.now()}`,
        caller: { id: "current-user" } as any, // Will be replaced with actual data
        callee: { id: calleeId } as any, // Will be replaced with actual data
        type: callType,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setActiveCall(optimisticCall);
      setCallStatus("pending");

      return { optimisticCall };
    },
    onSuccess: (data) => {
      // Replace optimistic call with real call data
      setActiveCall(data);
      setCallStatus(data.status);
      setInitiatingCall(false);

      // Invalidate active call query
      queryClient.invalidateQueries({ queryKey: callQueryKeys.active() });

      toast.success("Call initiated successfully");
    },
    onError: (error: any) => {
      // Rollback optimistic update
      setActiveCall(null);
      setCallStatus("idle");
      setInitiatingCall(false);

      // Handle specific error cases
      let errorMessage = "Failed to initiate call";
      if (error.response?.status === 403) {
        errorMessage = "Can only call friends";
      } else if (error.response?.status === 409) {
        errorMessage = "User is already in a call";
      } else if (error.response?.status === 404) {
        errorMessage = "User not found";
      }

      setCallError(errorMessage);
      toast.error(errorMessage);
    },
  });
};

/**
 * Hook to accept an incoming call
 */
export const useAcceptCall = () => {
  const queryClient = useQueryClient();
  const {
    setActiveCall,
    setCallStatus,
    setConnecting,
    setCallError,
    incomingCall,
    setIncomingCall,
  } = useCallStore();

  return useMutation({
    mutationFn: async (callId: string) => {
      return await CallsApiService.acceptCall(callId);
    },
    onMutate: (callId) => {
      // Optimistically update state
      if (incomingCall?.id === callId) {
        setActiveCall(incomingCall);
        setIncomingCall(null);
        setCallStatus("accepted");
        setConnecting(true);
        setCallError(null);
      }
    },
    onSuccess: () => {
      // Update call status
      setCallStatus("accepted");
      setConnecting(false);

      // Invalidate active call query
      queryClient.invalidateQueries({ queryKey: callQueryKeys.active() });

      toast.success("Call accepted");
    },
    onError: (error: any, callId) => {
      // Rollback optimistic update
      if (incomingCall?.id === callId) {
        setActiveCall(null);
        setIncomingCall(incomingCall);
        setCallStatus("ringing");
        setConnecting(false);
      }

      let errorMessage = "Failed to accept call";
      if (error.response?.status === 404) {
        errorMessage = "Call not found";
      } else if (error.response?.status === 409) {
        errorMessage = "Call cannot be accepted";
      }

      setCallError(errorMessage);
      toast.error(errorMessage);
    },
  });
};

/**
 * Hook to decline an incoming call
 */
export const useDeclineCall = () => {
  const queryClient = useQueryClient();
  const {
    setCallStatus,
    setCallError,
    addToRecentCalls,
    incomingCall,
    setIncomingCall,
  } = useCallStore();

  return useMutation({
    mutationFn: async (callId: string) => {
      return await CallsApiService.declineCall(callId);
    },
    onMutate: (callId) => {
      // Optimistically update state
      if (incomingCall?.id === callId) {
        // Add to recent calls before clearing
        addToRecentCalls({
          ...incomingCall,
          status: "declined",
          ended_at: new Date().toISOString(),
        });

        // Clear incoming call using the proper setter
        setIncomingCall(null);
        setCallStatus("idle");
        setCallError(null);
      }
    },
    onSuccess: () => {
      // Invalidate active call query
      queryClient.invalidateQueries({ queryKey: callQueryKeys.active() });

      toast.success("Call declined");
    },
    onError: (error: any) => {
      // Rollback optimistic update if needed
      let errorMessage = "Failed to decline call";
      if (error.response?.status === 404) {
        errorMessage = "Call not found";
      } else if (error.response?.status === 409) {
        errorMessage = "Call cannot be declined";
      }

      setCallError(errorMessage);
      toast.error(errorMessage);
    },
  });
};

/**
 * Hook to end an active call
 */
export const useEndCall = () => {
  const queryClient = useQueryClient();
  const {
    setActiveCall,
    setCallStatus,
    setConnecting,
    setCallError,
    addToRecentCalls,
    activeCall,
    getCurrentCallDuration,
  } = useCallStore();

  return useMutation({
    mutationFn: async (callId: string) => {
      return await CallsApiService.endCall(callId);
    },
    onMutate: (callId) => {
      // Optimistically update state
      if (activeCall?.id === callId) {
        // Add to recent calls before clearing
        addToRecentCalls({
          ...activeCall,
          status: "ended",
          ended_at: new Date().toISOString(),
          duration: getCurrentCallDuration(),
        });

        setActiveCall(null);
        setCallStatus("idle");
        setConnecting(false);
        setCallError(null);
      }
    },
    onSuccess: () => {
      // Invalidate active call query
      queryClient.invalidateQueries({ queryKey: callQueryKeys.active() });

      toast.success("Call ended");
    },
    onError: (error: any) => {
      // Handle error but don't rollback since ending call is critical
      let errorMessage = "Failed to end call";
      if (error.response?.status === 404) {
        errorMessage = "Call not found";
      } else if (error.response?.status === 409) {
        errorMessage = "Call cannot be ended";
      }

      setCallError(errorMessage);
      toast.error(errorMessage);

      // Still clear the call from UI even if API fails
      setActiveCall(null);
      setCallStatus("idle");
      setConnecting(false);
    },
  });
};

/**
 * Combined hook for call actions with optimistic updates
 */
export const useCallActions = () => {
  const initiateCall = useInitiateCall();
  const acceptCall = useAcceptCall();
  const declineCall = useDeclineCall();
  const endCall = useEndCall();

  return {
    initiateCall: initiateCall.mutate,
    acceptCall: acceptCall.mutate,
    declineCall: declineCall.mutate,
    endCall: endCall.mutate,

    // Loading states
    isInitiating: initiateCall.isPending,
    isAccepting: acceptCall.isPending,
    isDeclining: declineCall.isPending,
    isEnding: endCall.isPending,

    // Error states
    initiateError: initiateCall.error,
    acceptError: acceptCall.error,
    declineError: declineCall.error,
    endError: endCall.error,
  };
};

/**
 * Hook to handle WebSocket call messages and sync with store
 */
export const useCallWebSocketSync = () => {
  const queryClient = useQueryClient();
  const {
    setActiveCall,
    setCallStatus,
    activeCall,
    incomingCall,
    setIncomingCall,
  } = useCallStore();

  const handleCallRequest = (callData: Call) => {
    // Only set incoming call if not already in a call
    if (!activeCall && !incomingCall) {
      setIncomingCall(callData);
      setCallStatus("ringing");
    }
  };

  const handleCallResponse = (data: {
    call_id: string;
    response: "accepted" | "declined";
    caller_id: string;
    callee_id: string;
  }) => {
    if (activeCall?.id === data.call_id) {
      if (data.response === "accepted") {
        setCallStatus("accepted");
      } else {
        // Call was declined, clear active call
        setActiveCall(null);
        setCallStatus("idle");
      }
    }
  };

  const handleCallEnd = (data: {
    call_id: string;
    duration?: number;
    ended_by: string;
    caller_id: string;
    callee_id: string;
  }) => {
    if (activeCall?.id === data.call_id || incomingCall?.id === data.call_id) {
      setActiveCall(null);
      setIncomingCall(null);
      setCallStatus("idle");

      // Invalidate active call query
      queryClient.invalidateQueries({ queryKey: callQueryKeys.active() });
    }
  };

  return {
    handleCallRequest,
    handleCallResponse,
    handleCallEnd,
  };
};
