import { apiRequest } from "@/api/http";
import type { LoginResponse, UserMe } from "@/types/api";

export function login(username: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function getCurrentUser(): Promise<UserMe> {
  return apiRequest<UserMe>("/auth/me");
}
