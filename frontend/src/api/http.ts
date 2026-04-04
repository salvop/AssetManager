import { getAccessToken } from "../lib/session";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");

  if (!(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: "Richiesta non riuscita" }));
    throw new Error(errorBody.detail ?? "Richiesta non riuscita");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiDownload(path: string): Promise<{ blob: Blob; filename: string | null }> {
  const token = getAccessToken();
  const headers = new Headers();
  headers.set("Accept", "*/*");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: "Download non riuscito" }));
    throw new Error(errorBody.detail ?? "Download non riuscito");
  }

  const disposition = response.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  return { blob: await response.blob(), filename: match?.[1] ?? null };
}
