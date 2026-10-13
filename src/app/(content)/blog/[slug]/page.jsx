import { notFound } from "next/navigation";
import {
  getAllPosts,
  getPost,
  getRelated,
  slugifyTag,
} from "../../../../lib/posts.mjs";
import { renderMdx } from "../../../../lib/mdx";
import { getTech } from "../../../../lib/tech";
import PostCard, { fmtDate } from "../../../../components/blog/PostCard";
import { TechPills } from "../../../../components/blog/MdxComponents";
import JsonLd, { breadcrumbs } from "../../../../components/site/JsonLd";
import { Eyebrow } from "../../../../components/brand/Brand";
import { SITE_URL, SITE_NAME, AUTHOR } from "../../../../data/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `${SITE_URL}/blog/${slug}`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: url },
    robots: post.draft ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [AUTHOR.url],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const body = await renderMdx(post.content);
  const related = getRelated(post);
  const techs = post.techs.map(getTech).filter(Boolean);
  const url = `${SITE_URL}/blog/${slug}`;

  return (
    <div className="sf-container sf-page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BlogPosting",
              headline: post.title,
              description: post.description,
              url,
              mainEntityOfPage: url,
              datePublished: post.date,
              dateModified: post.updated ?? post.date,
              keywords: post.tags.join(", "),
              author: { "@type": "Person", ...AUTHOR },
              publisher: {
                "@type": "Organization",
                name: SITE_NAME,
                url: SITE_URL,
                logo: `${SITE_URL}/icon.svg`,
              },
            },
            breadcrumbs([
              ["Home", SITE_URL],
              ["Blog", `${SITE_URL}/blog`],
              [post.title, url],
            ]),
          ],
        }}
      />

      <div className="sf-article-layout">
        <article className="sf-article">
          <header className="sf-page-head">
            <Eyebrow index="01">
              <a href="/blog">Blog</a>
            </Eyebrow>
            <h1 className="sf-display sf-h1">{post.title}</h1>
            <p className="sf-lead">{post.description}</p>
            <div className="sf-post-meta sf-label">
              <span>By {AUTHOR.name}</span>
              <span>·</span>
              <time dateTime={post.date}>{fmtDate(post.date)}</time>
              {post.updated && post.updated !== post.date && (
                <>
                  <span>·</span>
                  <span>
                    Updated{" "}
                    <time dateTime={post.updated}>{fmtDate(post.updated)}</time>
                  </span>
                </>
              )}
              <span>·</span>
              <span>{post.readingMinutes} min read</span>
            </div>
          </header>

          <div className="sf-prose">{body}</div>

          <footer className="sf-article-foot">
            {post.tags.length > 0 && (
              <ul className="sf-post-tags">
                {post.tags.map((t) => (
                  <li key={t}>
                    <a href={`/blog/tag/${slugifyTag(t)}`}>#{t}</a>
                  </li>
                ))}
              </ul>
            )}
            <div className="sf-tile sf-article-cta">
              <div>
                <h2 className="sf-display sf-h3">
                  Get a stack card for your repo
                </h2>
                <p className="sf-body">
                  Paste a GitHub URL, pick a theme, copy one line into your
                  README. No sign-up.
                </p>
              </div>
              <a className="sf-btn sf-btn-primary" href="/">
                Scan a repo →
              </a>
            </div>
          </footer>
        </article>

        <aside className="sf-article-aside">
          {post.toc.length > 1 && (
            <nav className="sf-toc" aria-label="Table of contents">
              <span className="sf-label">On this page</span>
              <ol>
                {post.toc.map((h) => (
                  <li key={h.id} className={`d${h.depth}`}>
                    <a href={`#${h.id}`}>{h.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          {techs.length > 0 && (
            <div className="sf-toc">
              <span className="sf-label">Technologies</span>
              <TechPills techs={techs} />
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="sf-section">
          <Eyebrow index="02">Keep reading</Eyebrow>
          <div className="sf-post-grid">
            {related.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
