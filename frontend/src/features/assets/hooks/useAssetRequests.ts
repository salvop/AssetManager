import { useQuery } from "@tanstack/react-query";

import { getAssetRequests } from "@/features/assets/api/assetRequests";

type UseAssetRequestsParams = {
  page?: number;
  pageSize?: number;
};

export function useAssetRequests(params: UseAssetRequestsParams = {}) {
  return useQuery({
    queryKey: ["asset-requests", params],
    queryFn: () => {
      const requestParams: UseAssetRequestsParams = {};
      if (params.page !== undefined) requestParams.page = params.page;
      if (params.pageSize !== undefined) requestParams.pageSize = params.pageSize;
      return getAssetRequests(requestParams);
    },
  });
}
