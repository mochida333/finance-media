import type { MicroCMSQueries } from "microcms-js-sdk";
import { createClient } from "microcms-js-sdk";
import { getRuntimeEnv } from "./runtime-env";

const serviceDomain = getRuntimeEnv("MICROCMS_SERVICE_DOMAIN");
const apiKey = getRuntimeEnv("MICROCMS_API_KEY");
const enabled = Boolean(
  typeof serviceDomain === "string" &&
    serviceDomain.trim().length &&
    typeof apiKey === "string" &&
    apiKey.trim().length
);

const client = createClient({
  serviceDomain: serviceDomain ?? "",
  apiKey: apiKey ?? "",
});

export { client };
export type { MicroCMSQueries };

type MicroCMSListResponse<T> = {
  contents: T[];
  totalCount: number;
  offset: number;
  limit: number;
};

const emptyListResponse = <T>(queries?: MicroCMSQueries): MicroCMSListResponse<T> => ({
  contents: [],
  totalCount: 0,
  offset: typeof queries?.offset === "number" ? queries.offset : 0,
  limit: typeof queries?.limit === "number" ? queries.limit : 0,
});

export const getList = async <T>(endpoint: string, queries?: MicroCMSQueries) => {
  if (!enabled) return emptyListResponse<T>(queries);
  try {
    return await client.getList<T>({ endpoint, queries });
  } catch {
    // SSG/ビルド時に microCMS へ到達できない環境（未設定/ネットワーク制限）でも落とさない
    return emptyListResponse<T>(queries);
  }
};

export const getListDetail = async <T>(
  endpoint: string,
  contentId: string,
  queries?: MicroCMSQueries
) => {
  if (!enabled) {
    throw new Error(
      "microCMS is not configured. Set MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY."
    );
  }
  return await client.getListDetail<T>({ endpoint, contentId, queries });
};
