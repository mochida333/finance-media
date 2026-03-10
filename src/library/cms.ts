import type { MicroCMSQueries } from "microcms-js-sdk";
import { cmsConfig } from "./cms-config";
import { getList, getListDetail } from "./microcms";

type AnyRecord = Record<string, any>;

export type CmsRef = { id: string; name?: string };
export type CmsTagChip = { id: string; label: string };

export type CmsPostCard = {
  id: string;
  title: string;
  eyecatchUrl?: string;
  publishedAt?: string;
  categories: CmsRef[];
};

export type CmsPostDetail = {
  id: string;
  title: string;
  contentHtml: string;
  eyecatch?: { url: string; width?: number; height?: number };
  publishedAt?: string;
  categories: CmsRef[];
  tags: CmsTagChip[];
};

export type CmsPage = {
  id: string;
  title?: string;
  contentHtml?: string;
  showInHeader?: boolean;
};

const uniq = (xs: Array<string | null | undefined>) =>
  Array.from(new Set(xs.filter((x): x is string => Boolean(x && x.trim().length))));

const asArray = <T>(v: T | T[] | null | undefined) =>
  Array.isArray(v) ? v : v ? [v] : [];

const getField = <T = unknown>(obj: AnyRecord, field: string | null | undefined): T | undefined => {
  if (!obj || !field) return undefined;
  return obj[field] as T | undefined;
};

const normalizeRef = (v: unknown, nameField: string): CmsRef | null => {
  if (!v) return null;
  if (typeof v === "string") return { id: v, name: v };
  if (typeof v === "object") {
    const obj = v as AnyRecord;
    const id = typeof obj.id === "string" ? obj.id : undefined;
    const name = typeof obj[nameField] === "string" ? (obj[nameField] as string) : undefined;
    const fallback = name ?? id;
    if (!fallback) return null;
    return { id: id ?? fallback, name };
  }
  return null;
};

const normalizeRefs = (v: unknown, nameField: string) =>
  asArray(v)
    .map((x) => normalizeRef(x, nameField))
    .filter((x): x is CmsRef => Boolean(x));

const normalizeEyecatch = (v: unknown): CmsPostDetail["eyecatch"] | undefined => {
  if (!v || typeof v !== "object") return undefined;
  const obj = v as AnyRecord;
  const url = typeof obj.url === "string" ? obj.url : undefined;
  if (!url) return undefined;
  const width = typeof obj.width === "number" ? obj.width : undefined;
  const height = typeof obj.height === "number" ? obj.height : undefined;
  return { url, width, height };
};

const stripHtml = (html: string) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const excerpt = (html: string, max = 160) => {
  const s = stripHtml(html);
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
};

export const buildCategoryFilters = (categoryId: string) => {
  const f = cmsConfig.fields.post.category;
  return `${f}[equals]${categoryId}[or]${f}[contains]${categoryId}`;
};

export const buildTagFilters = (tagId: string) => {
  const f1 = cmsConfig.fields.post.tag ?? null;
  const f2 = cmsConfig.fields.post.tags ?? null;
  const parts = [
    f1 ? `${f1}[equals]${tagId}` : null,
    f1 ? `${f1}[contains]${tagId}` : null,
    f2 ? `${f2}[equals]${tagId}` : null,
    f2 ? `${f2}[contains]${tagId}` : null,
  ].filter(Boolean);
  return parts.join("[or]");
};

export async function getAllPostIds() {
  const ids: string[] = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const res = await getList<AnyRecord>(cmsConfig.endpoints.posts, {
      fields: ["id"],
      limit,
      offset,
    });
    ids.push(...(res.contents ?? []).map((c: AnyRecord) => c.id).filter(Boolean));
    offset += res.limit;
    if (offset >= res.totalCount) break;
  }
  return ids;
}

export async function getPostCards(params: {
  limit: number;
  offset: number;
  filters?: string;
}) {
  const f = cmsConfig.fields.post;
  const fields = uniq(["id", f.title, f.eyecatch, f.publishedAt, f.category]);
  const res = await getList<AnyRecord>(cmsConfig.endpoints.posts, {
    fields,
    depth: 1,
    limit: params.limit,
    offset: params.offset,
    filters: params.filters,
  });

  const cards: CmsPostCard[] = (res.contents ?? []).map((raw: AnyRecord) => {
    const title = String(getField(raw, f.title) ?? raw.id ?? "");
    const eyecatch = normalizeEyecatch(getField(raw, f.eyecatch));
    const publishedAt = (getField<string>(raw, f.publishedAt) ?? undefined) as string | undefined;
    const categories = normalizeRefs(getField(raw, f.category), cmsConfig.fields.category.name);
    return {
      id: String(raw.id),
      title,
      eyecatchUrl: eyecatch?.url,
      publishedAt,
      categories,
    };
  });

  return { ...res, cards };
}

export async function getPostDetail(id: string) {
  const f = cmsConfig.fields.post;
  const fields = uniq([
    "id",
    f.title,
    f.description ?? null,
    f.content,
    f.eyecatch,
    f.publishedAt,
    f.category,
    f.tags ?? null,
    f.tag ?? null,
  ]);

  const raw = await getListDetail<AnyRecord>(cmsConfig.endpoints.posts, id, { fields, depth: 1 });
  const title = String(getField(raw, f.title) ?? raw.id ?? "");
  const contentHtml = String(getField(raw, f.content) ?? "");
  const eyecatch = normalizeEyecatch(getField(raw, f.eyecatch));
  const publishedAt = (getField<string>(raw, f.publishedAt) ?? undefined) as string | undefined;
  const categories = normalizeRefs(getField(raw, f.category), cmsConfig.fields.category.name);

  const tagsRaw: unknown[] = [
    ...asArray(getField(raw, f.tags ?? null)),
    ...asArray(getField(raw, f.tag ?? null)),
  ];

  const tags = Array.from(
    new Map(
      tagsRaw
        .map((t): CmsTagChip | null => {
          if (!t) return null;
          if (typeof t === "string") return { id: t, label: t };
          if (typeof t === "object") {
            const obj = t as AnyRecord;
            const id = typeof obj.id === "string" ? obj.id : undefined;
            const name = typeof obj[cmsConfig.fields.tag.name] === "string" ? (obj[cmsConfig.fields.tag.name] as string) : undefined;
            const fallback = name ?? id;
            if (!fallback) return null;
            return { id: id ?? fallback, label: name ?? id ?? fallback };
          }
          return null;
        })
        .filter((x): x is CmsTagChip => Boolean(x))
        .map((x) => [x.id, x])
    ).values()
  );

  return {
    id: String(raw.id),
    title,
    contentHtml,
    eyecatch,
    publishedAt,
    categories,
    tags,
  } satisfies CmsPostDetail;
}

export async function getCategoryIds() {
  const ids: string[] = [];
  let offset = 0;
  while (true) {
    const res = await getList<AnyRecord>(cmsConfig.endpoints.categories, {
      fields: ["id"],
      limit: 100,
      offset,
    });
    ids.push(...(res.contents ?? []).map((c: AnyRecord) => c.id).filter(Boolean));
    offset += res.limit;
    if (offset >= res.totalCount) break;
  }
  return ids;
}

export async function getCategoryLabel(id: string) {
  const f = cmsConfig.fields.category.name;
  const raw = await getListDetail<AnyRecord>(cmsConfig.endpoints.categories, id, {
    fields: uniq(["id", f]),
  });
  const name = getField<string>(raw, f);
  return name ?? raw.id ?? id;
}

export async function getTagNameSafe(tagId: string) {
  const endpoint = cmsConfig.endpoints.tags;
  if (!endpoint) return tagId;
  try {
    const raw = await getListDetail<AnyRecord>(endpoint, tagId, {
      fields: uniq(["id", cmsConfig.fields.tag.name]),
    });
    const name = getField<string>(raw, cmsConfig.fields.tag.name);
    return name ?? raw.id ?? tagId;
  } catch {
    return tagId;
  }
}

export async function collectTagIdsFromAllPosts() {
  const f = cmsConfig.fields.post;
  const ids = new Set<string>();

  let offset = 0;
  while (true) {
    const res = await getList<AnyRecord>(cmsConfig.endpoints.posts, {
      fields: uniq(["id", f.tag ?? null, f.tags ?? null]),
      depth: 1,
      limit: 100,
      offset,
    });

    for (const raw of res.contents ?? []) {
      const raws = [...asArray(getField(raw, f.tags ?? null)), ...asArray(getField(raw, f.tag ?? null))];
      for (const t of raws) {
        if (!t) continue;
        if (typeof t === "string") ids.add(t);
        else if (typeof t === "object") {
          const obj = t as AnyRecord;
          const id = typeof obj.id === "string" ? obj.id : undefined;
          const name = typeof obj[cmsConfig.fields.tag.name] === "string" ? (obj[cmsConfig.fields.tag.name] as string) : undefined;
          const key = id ?? name;
          if (key) ids.add(key);
        }
      }
    }

    offset += res.limit;
    if (offset >= res.totalCount) break;
  }

  return Array.from(ids);
}

export async function getHeaderPagesSafe() {
  const endpoint = cmsConfig.endpoints.pages;
  if (!endpoint) return [] as CmsPage[];

  try {
    const f = cmsConfig.fields.page;
    const res = await getList<AnyRecord>(endpoint, {
      fields: uniq(["id", f.title, f.showInHeader]),
      limit: 100,
    });

    return (res.contents ?? []).map((raw: AnyRecord) => ({
      id: String(raw.id),
      title: getField<string>(raw, f.title) ?? String(raw.id),
      showInHeader: Boolean(getField(raw, f.showInHeader)),
    }));
  } catch {
    return [];
  }
}

export async function getPageIdsSafe() {
  const endpoint = cmsConfig.endpoints.pages;
  if (!endpoint) return [] as string[];

  try {
    const ids: string[] = [];
    let offset = 0;
    const limit = 100;
    while (true) {
      const res = await getList<AnyRecord>(endpoint, { fields: ["id"], limit, offset });
      ids.push(...(res.contents ?? []).map((c: AnyRecord) => c.id).filter(Boolean));
      offset += res.limit;
      if (offset >= res.totalCount) break;
    }
    return ids;
  } catch {
    return [];
  }
}

export async function getPageDetail(id: string): Promise<CmsPage> {
  const endpoint = cmsConfig.endpoints.pages;
  if (!endpoint) throw new Error("pages endpoint is disabled");

  const f = cmsConfig.fields.page;
  const raw = await getListDetail<AnyRecord>(endpoint, id, {
    fields: uniq(["id", f.title, f.content, f.showInHeader]),
  });

  return {
    id: String(raw.id),
    title: getField<string>(raw, f.title) ?? String(raw.id),
    contentHtml: getField<string>(raw, f.content) ?? "",
    showInHeader: Boolean(getField(raw, f.showInHeader)),
  };
}

export async function getRssItems(params?: { limit?: number }) {
  const f = cmsConfig.fields.post;
  const limit = params?.limit ?? 50;

  const res = await getList<AnyRecord>(cmsConfig.endpoints.posts, {
    fields: uniq(["id", f.title, f.description ?? null, f.content, f.publishedAt]),
    orders: `-${f.publishedAt}`,
    limit,
    offset: 0,
  } satisfies MicroCMSQueries);

  return (res.contents ?? []).map((raw: AnyRecord) => {
    const title = String(getField(raw, f.title) ?? raw.id ?? "");
    const descField = f.description ? getField<string>(raw, f.description) : undefined;
    const contentHtml = String(getField(raw, f.content) ?? "");
    const description = (descField && String(descField).trim().length ? String(descField) : excerpt(contentHtml)) || title;
    const publishedAt = getField<string>(raw, f.publishedAt);
    const pubDate = publishedAt ? new Date(publishedAt) : new Date();
    return {
      title,
      description,
      pubDate,
      link: `/${raw.id}/`,
    };
  });
}

