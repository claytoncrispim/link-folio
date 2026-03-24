import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useSyncExternalStore } from 'react';

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 4000;
const SUCCESS_RESET_MS = 1800;
const WARMUP_TIMEOUT_MS = 8000;
const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);

export type ApiRequestPhase = 'idle' | 'requesting' | 'warming' | 'retrying' | 'success' | 'error';

export type ApiRequestStatus = {
  phase: ApiRequestPhase;
  label: string;
  detail: string;
  attempt: number;
  maxRetries: number;
  method: string;
  path: string;
  updatedAt: number;
};

export type ApiStartupStatus = {
  checked: boolean;
  ok: boolean;
  message: string;
  baseUrl: string;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _requestId?: number;
  _retryCount?: number;
};

const buildIdleStatus = (): ApiRequestStatus => ({
  phase: 'idle',
  label: '',
  detail: '',
  attempt: 0,
  maxRetries: MAX_RETRIES,
  method: '',
  path: '',
  updatedAt: Date.now(),
});

const buildInitialStartupStatus = (): ApiStartupStatus => ({
  checked: false,
  ok: false,
  message: '',
  baseUrl: VITE_API_BASE_URL || '(same origin)',
});

let currentStatus = buildIdleStatus();
let startupStatus = buildInitialStartupStatus();
let activeRequests = 0;
let requestSequence = 0;
let resetTimer: number | undefined;
let startupCheckStarted = false;

const listeners = new Set<() => void>();
const startupListeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const subscribeStartup = (listener: () => void) => {
  startupListeners.add(listener);
  return () => startupListeners.delete(listener);
};

const getSnapshot = () => currentStatus;
const getStartupSnapshot = () => startupStatus;

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

const notifyStartupListeners = () => {
  startupListeners.forEach((listener) => listener());
};

const emitStatus = (status: ApiRequestStatus) => {
  if (resetTimer) {
    window.clearTimeout(resetTimer);
    resetTimer = undefined;
  }

  currentStatus = status;
  notifyListeners();
};

const resetStatus = () => {
  currentStatus = buildIdleStatus();
  notifyListeners();
};

const scheduleStatusReset = () => {
  if (resetTimer) {
    window.clearTimeout(resetTimer);
  }

  resetTimer = window.setTimeout(() => {
    resetStatus();
  }, SUCCESS_RESET_MS);
};

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const getRequestPath = (config?: RetryableRequestConfig) => config?.url ?? '';

const getRequestMethod = (config?: RetryableRequestConfig) =>
  (config?.method ?? 'get').toUpperCase();

const getRequestAction = (config?: RetryableRequestConfig) => {
  const path = getRequestPath(config);
  const method = getRequestMethod(config);

  if (method === 'POST' && path.includes('/api/auth/login')) return 'Signing you in';
  if (method === 'POST' && path.includes('/api/users')) return 'Creating your account';
  if (method === 'GET' && path.includes('/api/links')) return 'Loading your links';
  if (method === 'POST' && path.includes('/api/links')) return 'Saving your link';
  if (method === 'DELETE' && path.includes('/api/links/')) return 'Deleting your link';
  if (method === 'GET' && path.includes('/api/profile')) return 'Loading your session';

  return 'Contacting the server';
};

const buildStatus = (
  config: RetryableRequestConfig | undefined,
  phase: Exclude<ApiRequestPhase, 'idle'>,
  errorMessage?: string,
): ApiRequestStatus => {
  const retryCount = config?._retryCount ?? 0;
  const action = getRequestAction(config);

  if (phase === 'requesting') {
    return {
      phase,
      label: `${action}...`,
      detail: 'Waiting for the API response.',
      attempt: retryCount + 1,
      maxRetries: MAX_RETRIES,
      method: getRequestMethod(config),
      path: getRequestPath(config),
      updatedAt: Date.now(),
    };
  }

  if (phase === 'warming') {
    return {
      phase,
      label: 'Server is waking up.',
      detail: `${action} will continue automatically as soon as the Render service responds.`,
      attempt: retryCount + 1,
      maxRetries: MAX_RETRIES,
      method: getRequestMethod(config),
      path: getRequestPath(config),
      updatedAt: Date.now(),
    };
  }

  if (phase === 'retrying') {
    return {
      phase,
      label: `${action} again...`,
      detail: `Retry ${retryCount + 1} of ${MAX_RETRIES + 1}. This can happen while the free-tier backend is resuming.`,
      attempt: retryCount + 1,
      maxRetries: MAX_RETRIES,
      method: getRequestMethod(config),
      path: getRequestPath(config),
      updatedAt: Date.now(),
    };
  }

  if (phase === 'success') {
    return {
      phase,
      label: retryCount > 0 ? 'Server is awake.' : 'Request finished.',
      detail: retryCount > 0 ? `${action} completed after the backend resumed.` : `${action} completed successfully.`,
      attempt: retryCount + 1,
      maxRetries: MAX_RETRIES,
      method: getRequestMethod(config),
      path: getRequestPath(config),
      updatedAt: Date.now(),
    };
  }

  return {
    phase,
    label: 'Request failed.',
    detail: errorMessage ?? 'The server did not respond in time. Please try again.',
    attempt: retryCount + 1,
    maxRetries: MAX_RETRIES,
    method: getRequestMethod(config),
    path: getRequestPath(config),
    updatedAt: Date.now(),
  };
};

const getHealthCheckUrl = () => {
  if (!VITE_API_BASE_URL || VITE_API_BASE_URL === '/') {
    return '/api/health';
  }

  try {
    return new URL('/api/health', VITE_API_BASE_URL).toString();
  } catch {
    return '/api/health';
  }
};

const isLocalBaseUrl = () => {
  if (!VITE_API_BASE_URL) {
    return true;
  }

  try {
    const parsed = new URL(VITE_API_BASE_URL, window.location.origin);
    return ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname);
  } catch {
    return false;
  }
};

const runStartupApiCheck = async () => {
  const healthUrl = getHealthCheckUrl();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(healthUrl, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });

    startupStatus = {
      checked: true,
      ok: response.ok,
      message: response.ok
        ? ''
        : `API startup check failed (${response.status}). Verify VITE_API_BASE_URL and backend server status.`,
      baseUrl: VITE_API_BASE_URL || '(same origin)',
    };
  } catch {
    startupStatus = {
      checked: true,
      ok: false,
      message: `Cannot reach API at ${VITE_API_BASE_URL || '(same origin)'}. Check your backend server and client .env value.`,
      baseUrl: VITE_API_BASE_URL || '(same origin)',
    };
  } finally {
    window.clearTimeout(timeoutId);
    notifyStartupListeners();
  }
};

export const ensureApiStartupCheck = () => {
  if (startupCheckStarted) {
    return;
  }

  startupCheckStarted = true;

  if (!isLocalBaseUrl()) {
    startupStatus = {
      checked: true,
      ok: true,
      message: '',
      baseUrl: VITE_API_BASE_URL || '(same origin)',
    };
    notifyStartupListeners();
    return;
  }

  void runStartupApiCheck();
};

const warmUpServer = async () => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), WARMUP_TIMEOUT_MS);

  try {
    await fetch(getHealthCheckUrl(), {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch {
    // The warm-up probe is best-effort. The follow-up retry is what determines success.
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const isRetryableError = (error: AxiosError) => {
  if (error.code === 'ERR_NETWORK') {
    return true;
  }

  const status = error.response?.status;
  return typeof status === 'number' && RETRYABLE_STATUS_CODES.has(status);
};

const markRequestStarted = (config: RetryableRequestConfig) => {
  if (config._requestId == null) {
    config._requestId = ++requestSequence;
    activeRequests += 1;
  }
};

const markRequestSettled = () => {
  activeRequests = Math.max(0, activeRequests - 1);
};

const apiClient = axios.create({
  baseURL: VITE_API_BASE_URL ? VITE_API_BASE_URL : '/',
});

apiClient.interceptors.request.use((config) => {
  const requestConfig = config as RetryableRequestConfig;
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  markRequestStarted(requestConfig);
  emitStatus(buildStatus(requestConfig, requestConfig._retryCount ? 'retrying' : 'requesting'));

  return config;
}, (error) => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => {
    const requestConfig = response.config as RetryableRequestConfig;
    markRequestSettled();
    emitStatus(buildStatus(requestConfig, 'success'));

    if (activeRequests === 0) {
      scheduleStatusReset();
    }

    return response;
  },
  async (error) => {
    const axiosError = error as AxiosError;
    const originalRequest = axiosError.config as RetryableRequestConfig | undefined;

    if (originalRequest && isRetryableError(axiosError) && (originalRequest._retryCount ?? 0) < MAX_RETRIES) {
      originalRequest._retryCount = (originalRequest._retryCount ?? 0) + 1;
      emitStatus(buildStatus(originalRequest, 'warming'));
      await warmUpServer();
      await sleep(RETRY_DELAY_MS);
      return apiClient(originalRequest);
    }

    markRequestSettled();
    emitStatus(buildStatus(
      originalRequest,
      'error',
      axiosError.response?.status === 503
        ? 'The backend is still waking up. Please try again in a few seconds.'
        : axiosError.response?.data && typeof axiosError.response.data === 'object' && 'error' in axiosError.response.data
          ? String((axiosError.response.data as { error?: string }).error)
          : axiosError.message,
    ));

    return Promise.reject(error);
  }
);

export const useApiRequestStatus = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
export const useApiStartupStatus = () => useSyncExternalStore(subscribeStartup, getStartupSnapshot, getStartupSnapshot);

export default apiClient;