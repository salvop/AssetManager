import { apiRequest } from "./http";
import type { AppSettings, AppSettingsPayload, UserPreferences, UserPreferencesPayload } from "../types/api";

export function getMyPreferences() {
  return apiRequest<UserPreferences>("/me/preferences");
}

export function updateMyPreferences(payload: UserPreferencesPayload) {
  return apiRequest<UserPreferences>("/me/preferences", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getAppSettings() {
  return apiRequest<AppSettings>("/settings");
}

export function updateAppSettings(payload: AppSettingsPayload) {
  return apiRequest<AppSettings>("/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
