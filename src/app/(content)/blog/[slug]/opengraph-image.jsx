import { getAllPosts, getPost } from "../../../../lib/posts.mjs";
import { renderOg, ogSize } from "../../../../lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Stack Fingerprint blog post";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  return renderOg({
    eyebrow: "Stack Fingerprint · Blog",
    title: post?.title ?? "Stack Fingerprint",
    footer: post ? `${post.readingMinutes} min read` : "",
  });
}
