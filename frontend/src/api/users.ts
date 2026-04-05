import { apiRequest } from "./http";
import type { LookupListResponse, UserListItem, UserListResponse, UserPayload } from "../types/api";

type UserListParams = {
  page?: number;
  pageSize?: number;
};

export function getUsers(params: UserListParams = {}) {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("page_size", String(params.pageSize ?? 100));
  return apiRequest<UserListResponse>(`/users?${searchParams.toString()}`);
}

export function getUser(userId: number) {
  return apiRequest<UserListItem>(`/users/${userId}`);
}

export function getUserRoles() {
  return apiRequest<LookupListResponse>("/users/roles");
}

export function createUser(payload: UserPayload) {
  return apiRequest<UserListItem>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUser(userId: number, payload: UserPayload) {
  return apiRequest<UserListItem>(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
