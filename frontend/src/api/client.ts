import { currentToken } from '@/lib/auth';

export class ApiError extends Error {
  constructor(public status: number, public body: unknown, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await currentToken();

  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
    ...init,
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const detail = (body as { message?: string } | null)?.message ?? response.statusText;
    throw new ApiError(response.status, body, `[${response.status}] ${detail}`);
  }

  return body as T;
}

export const api = {
  get:   <T>(path: string)               => request<T>(path),
  post:  <T>(path: string, body?: unknown)   => request<T>(path, { method: 'POST',   body: body ? JSON.stringify(body) : undefined }),
  put:   <T>(path: string, body?: unknown)   => request<T>(path, { method: 'PUT',    body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown)   => request<T>(path, { method: 'PATCH',  body: body ? JSON.stringify(body) : undefined }),
  del:   <T>(path: string)               => request<T>(path, { method: 'DELETE' }),
};
