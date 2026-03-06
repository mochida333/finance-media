import type { MicroCMSQueries, MicroCMSListContent } from "microcms-js-sdk";
import { createClient } from "microcms-js-sdk";

const client = createClient({
  serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: import.meta.env.MICROCMS_API_KEY,
});

export type Category = {
  name?: string;
} & MicroCMSListContent;

export type Tag = {
  name?: string;
} & MicroCMSListContent;

// 型定義
export type Blog = {
  title: string;
  content: string;
  eyecatch: {
    url: string;
    height: number;
    width: number;
  };
  category?: Category | Category[];
  tags?: Array<string | Tag>;
  tag?: Tag;
} & MicroCMSListContent;

export const getBlogs = async (queries?: MicroCMSQueries) => {
  return await client.getList<Blog>({ endpoint: "blogs", queries });
};

export const getBlogDetail = async (
  contentId: string,
  queries?: MicroCMSQueries
) => {
  return await client.getListDetail<Blog>({
    endpoint: "blogs",
    contentId,
    queries,
  });
};

export const getCategories = async (queries?: MicroCMSQueries) => {
  return await client.getList<Category>({ endpoint: "categories", queries });
};

export const getCategoryDetail = async (
  contentId: string,
  queries?: MicroCMSQueries
) => {
  return await client.getListDetail<Category>({
    endpoint: "categories",
    contentId,
    queries,
  });
};

export const getTags = async (queries?: MicroCMSQueries) => {
  return await client.getList<Tag>({ endpoint: "tags", queries });
};

export const getTagDetail = async (
  contentId: string,
  queries?: MicroCMSQueries
) => {
  return await client.getListDetail<Tag>({
    endpoint: "tags",
    contentId,
    queries,
  });
};
