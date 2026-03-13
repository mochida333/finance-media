export type CmsConfig = {
  endpoints: {
    posts: string;
    categories: string;
    tags: string | null;
    pages: string | null;
  };
  fields: {
    post: {
      title: string;
      description?: string | null;
      content: string;
      eyecatch: string;
      publishedAt: string;
      category: string;
      tags?: string | null; // string[] など
      tag?: string | null; // 参照（単数/複数）など
    };
    category: {
      name: string;
    };
    tag: {
      name: string;
    };
    page: {
      title: string;
      content: string;
      showInHeader: string;
    };
  };
};

import { getBuildTimeEnv } from "./runtime-env";

const envString = (key: string, fallback: string) => {
  const v = getBuildTimeEnv(key) ?? (import.meta.env as any)?.[key];
  return typeof v === "string" && v.trim().length ? v : fallback;
};

const envOptionalString = (key: string, fallback: string | null) => {
  const v = getBuildTimeEnv(key) ?? (import.meta.env as any)?.[key];
  if (v === null || v === undefined) return fallback;
  if (typeof v !== "string") return fallback;
  const s = v.trim();
  return s.length ? s : null;
};

/**
 * microCMS のエンドポイント名/フィールド名が変わっても、
 * ここだけ直せば他のページ・コンポーネントは追従しやすい構成にするためのマップです。
 *
 * さらに柔軟にしたい場合は、下記の env で上書きできます（未指定ならデフォルト）。
 * - エンドポイント:
 *   - MICROCMS_ENDPOINT_POSTS / CATEGORIES / TAGS / PAGES
 * - フィールド:
 *   - MICROCMS_FIELD_POST_TITLE / DESCRIPTION / CONTENT / EYECATCH / PUBLISHED_AT / CATEGORY / TAGS / TAG
 *   - MICROCMS_FIELD_CATEGORY_NAME
 *   - MICROCMS_FIELD_TAG_NAME
 *   - MICROCMS_FIELD_PAGE_TITLE / CONTENT / SHOW_IN_HEADER
 */
export const cmsConfig: CmsConfig = {
  endpoints: {
    posts: envString("MICROCMS_ENDPOINT_POSTS", "blogs"),
    categories: envString("MICROCMS_ENDPOINT_CATEGORIES", "categories"),
    tags: envOptionalString("MICROCMS_ENDPOINT_TAGS", "tags"),
    pages: envOptionalString("MICROCMS_ENDPOINT_PAGES", "pages"),
  },
  fields: {
    post: {
      title: envString("MICROCMS_FIELD_POST_TITLE", "title"),
      description: envOptionalString("MICROCMS_FIELD_POST_DESCRIPTION", null),
      content: envString("MICROCMS_FIELD_POST_CONTENT", "content"),
      eyecatch: envString("MICROCMS_FIELD_POST_EYECATCH", "eyecatch"),
      publishedAt: envString("MICROCMS_FIELD_POST_PUBLISHED_AT", "publishedAt"),
      category: envString("MICROCMS_FIELD_POST_CATEGORY", "category"),
      tags: envOptionalString("MICROCMS_FIELD_POST_TAGS", "tags"),
      tag: envOptionalString("MICROCMS_FIELD_POST_TAG", "tag"),
    },
    category: {
      name: envString("MICROCMS_FIELD_CATEGORY_NAME", "name"),
    },
    tag: {
      name: envString("MICROCMS_FIELD_TAG_NAME", "name"),
    },
    page: {
      title: envString("MICROCMS_FIELD_PAGE_TITLE", "title"),
      content: envString("MICROCMS_FIELD_PAGE_CONTENT", "content"),
      showInHeader: envString("MICROCMS_FIELD_PAGE_SHOW_IN_HEADER", "showInHeader"),
    },
  },
};

