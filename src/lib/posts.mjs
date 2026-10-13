// src/lib/posts.mjs
// Blog post index. Plain Node (fs + gray-matter, relative imports only) so
// site-seo-kit can import it at build time to list /blog URLs.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content", "blog");
const WORDS_PER_MINUTE = 220;

const toISO = (d) =>
  d instanceof Date ? d.toISOString().slice(0, 10) : d ? String(d) : null;

export const slugifyTag = (tag) =>
  tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function readPost(file) {
  const slug = file.replace(/\.mdx?$/, "");
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const words = content.split(/\s+/).filter(Boolean).length;
  return {
    slug,
    title: data.title,
    description: data.description ?? "",
    date: toISO(data.date),
    updated: toISO(data.updated),
    tags: data.tags ?? [],
    techs: data.techs ?? [],
    cover: data.cover ?? null,
    featured: Boolean(data.featured),
    draft: Boolean(data.draft),
    readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    toc: extractToc(content),
    content,
  };
}

// h2/h3 outside fenced code blocks; ids match rehype-slug (github-slugger).
function extractToc(content) {
  const toc = [];
  const seen = new Map();
  let inFence = false;
  for (const line of content.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const text = m[2].replace(/[`*_]/g, "").replace(/\[(.+?)\]\(.+?\)/g, "$1");
    let id = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s/g, "-");
    const n = seen.get(id) ?? 0;
    seen.set(id, n + 1);
    if (n) id = `${id}-${n}`;
    toc.push({ depth: m[1].length, text, id });
  }
  return toc;
}

let cache = null;

/** All published posts, newest first. Drafts only show in development. */
export function getAllPosts() {
  if (cache && process.env.NODE_ENV === "production") return cache;
  const files = fs.existsSync(POSTS_DIR)
    ? fs.readdirSync(POSTS_DIR).filter((f) => /\.mdx?$/.test(f))
    : [];
  const showDrafts = process.env.NODE_ENV === "development";
  cache = files
    .map(readPost)
    .filter((p) => showDrafts || !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return cache;
}

export function getPost(slug) {
  return getAllPosts().find((p) => p.slug === slug) ?? null;
}

/** [{ tag, slug, count }] sorted by count. */
export function getAllTags() {
  const counts = new Map();
  for (const p of getAllPosts())
    for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts]
    .map(([tag, count]) => ({ tag, slug: slugifyTag(tag), count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function getPostsByTag(tagSlug) {
  return getAllPosts().filter((p) =>
    p.tags.some((t) => slugifyTag(t) === tagSlug)
  );
}

export function getPostsByTech(techId) {
  return getAllPosts().filter((p) => p.techs.includes(techId));
}

/** Posts sharing the most tags/techs with `post`, then newest. */
export function getRelated(post, limit = 3) {
  return getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({
      p,
      score:
        p.tags.filter((t) => post.tags.includes(t)).length * 2 +
        p.techs.filter((t) => post.techs.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score || (a.p.date < b.p.date ? 1 : -1))
    .slice(0, limit)
    .map(({ p }) => p);
}
