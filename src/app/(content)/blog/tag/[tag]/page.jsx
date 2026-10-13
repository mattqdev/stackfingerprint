import { notFound } from "next/navigation";
import { getAllTags, getPostsByTag } from "../../../../../lib/posts.mjs";
import PostCard from "../../../../../components/blog/PostCard";
import { Eyebrow } from "../../../../../components/brand/Brand";
import { SITE_URL } from "../../../../../data/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTags().map((t) => ({ tag: t.slug }));
}

export async function generateMetadata({ params }) {
  const { tag } = await params;
  const t = getAllTags().find((x) => x.slug === tag);
  if (!t) return {};
  return {
    title: `#${t.tag} articles`,
    description: `Articles about ${t.tag} on the Stack Fingerprint blog.`,
    alternates: { canonical: `${SITE_URL}/blog/tag/${tag}` },
    // Thin archive pages: let crawlers follow links without indexing them.
    robots: t.count < 3 ? { index: false, follow: true } : undefined,
  };
}

export default async function TagPage({ params }) {
  const { tag } = await params;
  const t = getAllTags().find((x) => x.slug === tag);
  if (!t) notFound();
  const posts = getPostsByTag(tag);
  return (
    <div className="sf-container sf-page">
      <header className="sf-page-head">
        <Eyebrow index="01">
          <a href="/blog">Blog</a> / tag
        </Eyebrow>
        <h1 className="sf-display sf-h1">#{t.tag}</h1>
      </header>
      <div className="sf-post-grid">
        {posts.map((p) => (
          <PostCard key={p.slug} post={p} />
        ))}
      </div>
    </div>
  );
}
