import axios, { AxiosError } from "axios";
export type ApiError = {
  code?: string;
  message: string;
};
export const Api = axios.create({
  baseURL: "http://localhost:8001/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});
Api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const apiError: ApiError = {
      message:
        error.response?.data?.message || error.message || "An error occurred",
      code: error.code,
    };
    return Promise.reject(apiError);
  },
);
Api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
