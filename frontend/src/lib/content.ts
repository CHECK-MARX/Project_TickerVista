import matter from "gray-matter";
import { Buffer } from "buffer";

if (typeof globalThis !== "undefined" && typeof globalThis.Buffer === "undefined") {
  globalThis.Buffer = Buffer;
}

export type MarkdownEntry = {
  collection: string;
  slug: string;
  title: string;
  summary?: string;
  tags: string[];
  order?: number;
  reference?: string;
  content: string;
};

type Collections = Record<string, MarkdownEntry[]>;

const markdownFiles = import.meta.glob("../content/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true
}) as Record<string, string>;

const collections: Collections = {};

Object.entries(markdownFiles).forEach(([path, raw]) => {
  const parsed = matter(raw);
  const segments = path.replace("../content/", "").split("/");
  const collection = segments[0];
  const fileName = segments[segments.length - 1];
  const slug = (parsed.data.slug as string) ?? fileName.replace(".md", "");

  const entry: MarkdownEntry = {
    collection,
    slug,
    title: parsed.data.title as string,
    summary: parsed.data.summary as string | undefined,
    tags: (parsed.data.tags as string[]) ?? [],
    order: typeof parsed.data.order === "number" ? (parsed.data.order as number) : undefined,
    reference: parsed.data.reference as string | undefined,
    content: parsed.content.trim()
  };

  if (!collections[collection]) {
    collections[collection] = [];
  }
  collections[collection].push(entry);
});

Object.values(collections).forEach((entries) => {
  entries.sort((a, b) => {
    if (a.order != null && b.order != null) {
      return a.order - b.order;
    }
    return a.title.localeCompare(b.title);
  });
});

export const getCollection = (collection: string): MarkdownEntry[] => {
  return collections[collection] ?? [];
};

export const getEntry = (collection: string, slug: string): MarkdownEntry | undefined => {
  return getCollection(collection).find((entry) => entry.slug === slug);
};
