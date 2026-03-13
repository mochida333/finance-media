export function getBuildTimeEnv(key: string): string | undefined {
  const fromVite = (import.meta as any)?.env?.[key];
  if (typeof fromVite === "string" && fromVite.trim().length) return fromVite;

  const fromNode = (globalThis as any)?.process?.env?.[key];
  if (typeof fromNode === "string" && fromNode.trim().length) return fromNode;

  return undefined;
}

