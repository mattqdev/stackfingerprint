// src/lib/mdx.jsx — compiles a post body to React (server only).
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import { mdxComponents } from "../components/blog/MdxComponents";

export async function renderMdx(source) {
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      // Posts are our own files: allow JS expressions in props (code={`…`}).
      blockJS: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypePrettyCode, { theme: "vitesse-black", keepBackground: false }],
        ],
      },
    },
  });
  return content;
}
