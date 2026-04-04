import { useQuery } from "@tanstack/react-query";

import { getCurrentUser } from "../api/auth";
import { getAccessToken } from "../lib/session";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: Boolean(getAccessToken()),
    retry: false,
  });
}
