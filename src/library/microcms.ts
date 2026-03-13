import type { MicroCMSQueries } from "microcms-js-sdk";
import { createClient } from "microcms-js-sdk";

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

type Credentials = { serviceDomain: string; apiKey: string };

const getStringEnv = (key: string): string | undefined => {
  const fromVite = (import.meta as any)?.env?.[key];
  if (typeof fromVite === "string" && fromVite.trim().length) return fromVite;
  const fromNode = (globalThis as any)?.process?.env?.[key];
  if (typeof fromNode === "string" && fromNode.trim().length) return fromNode;
  return undefined;
};

const resolveCredentials = async (): Promise<Credentials | null> => {
  const serviceDomain = getStringEnv("MICROCMS_SERVICE_DOMAIN");
  const apiKey = getStringEnv("MICROCMS_API_KEY");
  if (serviceDomain && apiKey) return { serviceDomain, apiKey };

  // Cloudflare Pages Functions / Workers runtime
  try {
    const mod = await import("cloudflare:workers");
    const env = (mod as any)?.env;
    const sd = typeof env?.MICROCMS_SERVICE_DOMAIN === "string" ? env.MICROCMS_SERVICE_DOMAIN : undefined;
    const ak = typeof env?.MICROCMS_API_KEY === "string" ? env.MICROCMS_API_KEY : undefined;
    if (sd && ak) return { serviceDomain: sd, apiKey: ak };
  } catch {
    // ignore (e.g. node prerender)
  }

  return null;
};

let clientPromise: Promise<{ client: ReturnType<typeof createClient>; enabled: boolean }> | null = null;
const getClient = async () => {
  if (clientPromise) return await clientPromise;
  clientPromise = (async () => {
    const creds = await resolveCredentials();
    const enabled = Boolean(creds?.serviceDomain && creds?.apiKey);
    const client = createClient({
      serviceDomain: creds?.serviceDomain ?? "",
      apiKey: creds?.apiKey ?? "",
    });
    return { client, enabled };
  })();
  return await clientPromise;
};

export const getList = async <T>(endpoint: string, queries?: MicroCMSQueries) => {
  const { client, enabled } = await getClient();
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
  const { client, enabled } = await getClient();
  if (!enabled) {
    throw new Error(
      "microCMS is not configured. Set MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY."
    );
  }
  return await client.getListDetail<T>({ endpoint, contentId, queries });
};
