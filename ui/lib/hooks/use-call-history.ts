import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { CallsApiService } from "../api/calls";
import { Call } from "../schemas/messaging";
import { toast } from "sonner";

// Query keys for call history queries
export const callHistoryQueryKeys = {
  all: ["call-history"] as const,
  list: () => [...callHistoryQueryKeys.all, "list"] as const,
  listWithParams: (params: { limit?: number }) =>
    [...callHistoryQueryKeys.list(), params] as const,
};

/**
 * Hook to get call history with pagination
 */
export const useCallHistory = (params: { limit?: number } = {}) => {
  const limit = params.limit || 20;

  const query = useInfiniteQuery({
    queryKey: callHistoryQueryKeys.listWithParams({ limit }),
    queryFn: async ({ pageParam = 0 }) => {
      const calls = await CallsApiService.getCallHistory({
        limit,
        offset: pageParam,
      });

      return {
        calls,
        nextOffset: calls.length === limit ? pageParam + limit : undefined,
        hasMore: calls.length === limit,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
  });

  useEffect(() => {
    if (query.isError) {
      console.error("Failed to fetch call history:", query.error);
      toast.error("Failed to load call history");
    }
  }, [query.isError, query.error]);

  return query;
};

/**
 * Hook to get recent calls (first page only)
 */
export const useRecentCalls = (limit: number = 10) => {
  const query = useQuery({
    queryKey: callHistoryQueryKeys.listWithParams({ limit }),
    queryFn: async () => {
      const calls = await CallsApiService.getCallHistory({
        limit,
        offset: 0,
      });
      return calls;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (query.isError) {
      console.error("Failed to fetch recent calls:", query.error);
      toast.error("Failed to load recent calls");
    }
  }, [query.isError, query.error]);

  return query;
};

/**
 * Hook to get call history statistics
 */
export const useCallHistoryStats = () => {
  const query = useQuery({
    queryKey: [...callHistoryQueryKeys.all, "stats"],
    queryFn: async () => {
      // Get a larger sample of call history to calculate stats
      const calls = await CallsApiService.getCallHistory({
        limit: 100,
        offset: 0,
      });

      // Calculate statistics from the call history
      const stats = {
        totalCalls: calls.length,
        completedCalls: calls.filter(
          (call) =>
            call.status === "ended" && call.duration && call.duration > 0
        ).length,
        missedCalls: calls.filter((call) => call.status === "missed").length,
        declinedCalls: calls.filter((call) => call.status === "declined")
          .length,
        totalDuration: calls
          .filter((call) => call.duration)
          .reduce((sum, call) => sum + (call.duration || 0), 0),
        averageDuration: 0,
        voiceCalls: calls.filter((call) => call.type === "voice").length,
        videoCalls: calls.filter((call) => call.type === "video").length,
      };

      // Calculate average duration
      const callsWithDuration = calls.filter(
        (call) => call.duration && call.duration > 0
      );
      if (callsWithDuration.length > 0) {
        stats.averageDuration = stats.totalDuration / callsWithDuration.length;
      }

      return stats;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  useEffect(() => {
    if (query.isError) {
      console.error("Failed to fetch call statistics:", query.error);
      toast.error("Failed to load call statistics");
    }
  }, [query.isError, query.error]);

  return query;
};

/**
 * Hook to get call history filtered by user
 */
export const useCallHistoryWithUser = (userId: string, limit: number = 20) => {
  const query = useQuery({
    queryKey: [...callHistoryQueryKeys.all, "with-user", userId, { limit }],
    queryFn: async () => {
      const allCalls = await CallsApiService.getCallHistory({
        limit: 100, // Get more calls to filter
        offset: 0,
      });

      // Filter calls involving the specific user
      const filteredCalls = allCalls
        .filter(
          (call) => call.caller.id === userId || call.callee.id === userId
        )
        .slice(0, limit);

      return filteredCalls;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  useEffect(() => {
    if (query.isError) {
      console.error("Failed to fetch call history with user:", query.error);
      toast.error("Failed to load call history");
    }
  }, [query.isError, query.error]);

  return query;
};

/**
 * Hook to get missed calls count
 */
export const useMissedCallsCount = () => {
  const query = useQuery({
    queryKey: [...callHistoryQueryKeys.all, "missed-count"],
    queryFn: async () => {
      const calls = await CallsApiService.getCallHistory({
        limit: 50, // Get recent calls to count missed ones
        offset: 0,
      });

      const missedCount = calls.filter(
        (call) => call.status === "missed"
      ).length;
      return { count: missedCount };
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (query.isError) {
      console.error("Failed to fetch missed calls count:", query.error);
    }
  }, [query.isError, query.error]);

  return query;
};

/**
 * Utility function to format call duration
 */
export const formatCallDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    if (remainingSeconds === 0) {
      return `${minutes}m`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0 && remainingSeconds === 0) {
    return `${hours}h`;
  } else if (remainingSeconds === 0) {
    return `${hours}h ${remainingMinutes}m`;
  }

  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
};

/**
 * Utility function to get call status display text
 */
export const getCallStatusText = (
  call: Call,
  currentUserId: string
): string => {
  const isOutgoing = call.caller.id === currentUserId;

  switch (call.status) {
    case "ended":
      return isOutgoing ? "Outgoing call" : "Incoming call";
    case "missed":
      return isOutgoing ? "Missed call" : "Missed call";
    case "declined":
      return isOutgoing ? "Call declined" : "Declined call";
    case "failed":
      return "Call failed";
    default:
      return call.status;
  }
};

/**
 * Utility function to get call type icon
 */
export const getCallTypeIcon = (callType: string): string => {
  switch (callType) {
    case "video":
      return "📹";
    case "voice":
    default:
      return "📞";
  }
};

/**
 * Combined hook for call history with utilities
 */
export const useCallHistoryWithUtils = (params: { limit?: number } = {}) => {
  const callHistory = useCallHistory(params);
  const stats = useCallHistoryStats();
  const missedCount = useMissedCallsCount();

  return {
    ...callHistory,
    stats: stats.data,
    statsLoading: stats.isLoading,
    statsError: stats.error,
    missedCount: missedCount.data?.count || 0,
    missedCountLoading: missedCount.isLoading,

    // Utility functions
    formatDuration: formatCallDuration,
    getStatusText: getCallStatusText,
    getTypeIcon: getCallTypeIcon,
  };
};
