import { apiRequest } from "./http";
import type { LookupListResponse, UserListItem, UserListResponse, UserPayload } from "../types/api";

export function getUsers() {
  return apiRequest<UserListResponse>("/users");
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
