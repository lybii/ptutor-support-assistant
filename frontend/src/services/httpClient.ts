// Gọi API backend: gắn access token, bóc vỏ ApiResponse, ném ApiError có mã lỗi ổn định.
import { clearStoredTokens, getStoredTokens } from '../auth/authStorage';
import type { ApiResponse } from '../types/page';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, status = 0, code = 'REQUEST_FAILED', fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export type HttpRequestOptions = RequestInit;

export function get<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
  return request<T>(path, { ...options, method: 'GET' });
}

export function post<T>(path: string, body?: unknown, options: HttpRequestOptions = {}): Promise<T> {
  return request<T>(path, withBody('POST', body, options));
}

export function put<T>(path: string, body?: unknown, options: HttpRequestOptions = {}): Promise<T> {
  return request<T>(path, withBody('PUT', body, options));
}

export function patch<T>(path: string, body?: unknown, options: HttpRequestOptions = {}): Promise<T> {
  return request<T>(path, withBody('PATCH', body, options));
}

export function del<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
  return request<T>(path, { ...options, method: 'DELETE' });
}

function withBody(method: string, body: unknown, options: HttpRequestOptions): HttpRequestOptions {
  return body === undefined ? { ...options, method } : { ...options, method, body: JSON.stringify(body) };
}

export async function request<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = getStoredTokens()?.accessToken;
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('Không kết nối được máy chủ.', 0, 'NETWORK_ERROR');
  }

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (response.status === 401 && token) clearStoredTokens();
  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.message ?? `Yêu cầu thất bại (${response.status}).`,
      response.status,
      payload?.code ?? 'REQUEST_FAILED',
      payload?.errors ?? {}
    );
  }
  return payload.data;
}
