import axios, {AxiosError} from 'axios';
import {env} from '@/config/env';

/** Error thrown by every API call: the backend's `message` plus the HTTP status (if any). */
export class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Axios instance for expressJs_ecommerce_backend. Paths include the `/api` prefix. */
export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 30_000,
});

/** Sets or clears `Authorization: Bearer <jwt>` (called by AuthContext). */
export const setAuthToken = (token: string | null): void => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

// The backend answers errors with a non-2xx `{success: false, message}`.
apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError<{message?: string; error?: string}>) => {
    const body = error.response?.data;
    const message = body?.message || body?.error || error.message || 'Request failed';
    return Promise.reject(new ApiError(message, error.response?.status));
  },
);

/** Multipart file part for React Native's FormData. */
export const imageFilePart = (uri: string, index: number) =>
  ({uri, name: `image${index + 1}.jpg`, type: 'image/jpeg'} as unknown as Blob);
