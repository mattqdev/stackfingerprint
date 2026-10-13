import { getAllPosts, getAllTags } from "../../../lib/posts.mjs";
import PostCard from "../../../components/blog/PostCard";
import JsonLd from "../../../components/site/JsonLd";
import { Eyebrow } from "../../../components/brand/Brand";
import { SITE_URL, SITE_NAME } from "../../../data/site";

const DESCRIPTION =
  "Guides on README tech stack badges, GitHub profile READMEs, stack detection and keeping your project docs up to date automatically.";

export const metadata = {
  title: "Blog — README badges, GitHub profiles & stack detection",
  description: DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/blog`,
    types: { "application/rss+xml": `${SITE_URL}/blog/rss.xml` },
  },
  openGraph: {
    title: `${SITE_NAME} Blog`,
    description: DESCRIPTION,
    url: `${SITE_URL}/blog`,
    type: "website",
  },
};

export default function BlogIndex() {
  const posts = getAllPosts();
  const tags = getAllTags();
  const featured = posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p !== featured);

  return (
    <div className="sf-container sf-page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: `${SITE_NAME} Blog`,
          url: `${SITE_URL}/blog`,
          description: DESCRIPTION,
          blogPost: posts.map((p) => ({
            "@type": "BlogPosting",
            headline: p.title,
            url: `${SITE_URL}/blog/${p.slug}`,
            datePublished: p.date,
          })),
        }}
      />
      <header className="sf-page-head">
        <Eyebrow index="01">Blog</Eyebrow>
        <h1 className="sf-display sf-h1">Notes from the scanner.</h1>
        <p className="sf-lead">{DESCRIPTION}</p>
        {tags.length > 0 && (
          <ul className="sf-post-tags">
            {tags.map((t) => (
              <li key={t.slug}>
                <a href={`/blog/tag/${t.slug}`}>
                  #{t.tag} <span>{t.count}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </header>

      {featured ? (
        <>
          <PostCard post={featured} large />
          <div className="sf-post-grid">
            {rest.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </>
      ) : (
        <p className="sf-body">No posts yet.</p>
      )}
    </div>
  );
}
