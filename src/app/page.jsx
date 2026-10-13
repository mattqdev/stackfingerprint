import HomeClient from "../components/HomeClient";
import PostCard from "../components/blog/PostCard";
import { Eyebrow } from "../components/brand/Brand";
import { getAllPosts } from "../lib/posts.mjs";
import JsonLd from "../components/site/JsonLd";
import { SITE_URL, SITE_NAME, GITHUB_REPO, AUTHOR } from "../data/site";

const HOME_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    {
      "@type": "WebApplication",
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      description:
        "Analyze any GitHub repository to identify its tech stack and generate an embeddable SVG card for your README.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: { "@type": "Person", name: AUTHOR.name, url: AUTHOR.url },
      sameAs: [GITHUB_REPO],
    },
  ],
};

function LatestPosts() {
  const posts = getAllPosts().slice(0, 3);
  if (!posts.length) return null;
  return (
    <section className="sf-section sf-home-posts">
      <div className="sf-container">
        <div className="sf-section-head">
          <div>
            <Eyebrow index="05">From the blog</Eyebrow>
            <h2 className="sf-display sf-h2">Better READMEs.</h2>
          </div>
          <a href="/blog">All articles →</a>
        </div>
        <div className="sf-post-grid">
          {posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <>
      <JsonLd data={HOME_LD} />
      <HomeClient latestPosts={<LatestPosts />} />
    </>
  );
}
