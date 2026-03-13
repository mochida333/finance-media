import { env as cfEnv } from "cloudflare:workers";

export function getRuntimeEnv(key: string): string | undefined {
  const fromVite = (import.meta as any)?.env?.[key];
  if (typeof fromVite === "string" && fromVite.trim().length) return fromVite;

  const fromCf = (cfEnv as any)?.[key];
  if (typeof fromCf === "string" && fromCf.trim().length) return fromCf;

  return undefined;
}

