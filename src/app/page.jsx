import HomeClient from "../components/HomeClient";
import PostCard from "../components/blog/PostCard";
import { Eyebrow } from "../components/brand/Brand";
import { getAllPosts } from "../lib/posts.mjs";

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
  return <HomeClient latestPosts={<LatestPosts />} />;
}
