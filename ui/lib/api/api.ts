import axios, { AxiosError, AxiosResponse } from "axios";
import { ApiError, ApiResponse, PaginatedResponse } from "../schemas/api-types";

// Enhanced API Error type
export interface EnhancedApiError extends ApiError {
  status?: number;
  timestamp: string;
  path?: string;
}

// Response transformation utilities
export const transformApiResponse = <T>(response: AxiosResponse): T => {
  return response.data;
};

export const transformPaginatedResponse = <T>(
  response: AxiosResponse
): PaginatedResponse<T> => {
  return response.data;
};

// Create axios instance with enhanced configuration
export const Api = axios.create({
  baseURL: "http://localhost:8001/api/v1",
  timeout: 30000, // Increased timeout for better reliability
  headers: {
    "Content-Type": "application/json",
  },
});

// Enhanced request interceptor with better token management
Api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    (config as any).metadata = { startTime: Date.now() };

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with better error handling
Api.interceptors.response.use(
  (response) => {
    // Log response time for debugging
    const endTime = Date.now();
    const startTime = (response.config as any).metadata?.startTime || endTime;
    console.debug(
      `API ${response.config.method?.toUpperCase()} ${
        response.config.url
      } took ${endTime - startTime}ms`
    );

    return response;
  },
  (error: AxiosError) => {
    const enhancedError: EnhancedApiError = {
      code: error.response?.status || 0,
      message: getErrorMessage(error),
      status: error.response?.status,
      timestamp: new Date().toISOString(),
      path: error.config?.url,
      details: error.response?.data as Record<string, any>,
    };

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem("authToken");
      // Optionally redirect to login
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/signin"
      ) {
        window.location.href = "/signin";
      }
    }

    console.error("API Error:", enhancedError);
    return Promise.reject(enhancedError);
  }
);

// Helper function to extract meaningful error messages
const getErrorMessage = (error: AxiosError): string => {
  if (error.response?.data) {
    const data = error.response.data as any;
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (typeof data === "string") return data;
  }

  if (error.message) return error.message;

  // Fallback messages based on status code
  switch (error.response?.status) {
    case 400:
      return "Invalid request. Please check your input.";
    case 401:
      return "Authentication required. Please sign in.";
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 429:
      return "Too many requests. Please try again later.";
    case 500:
      return "Server error. Please try again later.";
    default:
      return "An unexpected error occurred.";
  }
};

// Utility functions for common API patterns
export const handleApiCall = async <T>(
  apiCall: () => Promise<AxiosResponse<T>>
): Promise<T> => {
  try {
    const response = await apiCall();
    return transformApiResponse<T>(response);
  } catch (error) {
    throw error; // Re-throw enhanced error from interceptor
  }
};

export const handlePaginatedApiCall = async <T>(
  apiCall: () => Promise<AxiosResponse<PaginatedResponse<T>>>
): Promise<PaginatedResponse<T>> => {
  try {
    const response = await apiCall();
    return transformPaginatedResponse<T>(response);
  } catch (error) {
    throw error; // Re-throw enhanced error from interceptor
  }
};

// Type guard for API errors
export const isApiError = (error: any): error is EnhancedApiError => {
  return (
    error &&
    typeof error === "object" &&
    "message" in error &&
    "timestamp" in error
  );
};
