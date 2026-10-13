// site-seo-kit configuration. Every option is documented in
// node_modules/site-seo-kit/README.md. Delete a section (or set it to false)
// to turn that module off.

/** @type {import("site-seo-kit").Config} */
export default {
  site: "https://stackfingerprint.vercel.app",
  name: "Stack Fingerprint",
  description:
    "Analyze any GitHub repository to identify its tech stack and generate an embeddable SVG card for your README.",
  publicDir: "public",
  // Also written here when the folder exists (the build output).
  mirrorDirs: ["out"],

  routes: {
    // Pages found on disk. Dynamic segments ([slug]) can't be discovered:
    // list those URLs in `sources`.
    discover: { next: "src/app" },
    // Hand-written entries; merged over discovered ones with the same path.
    static: [{ path: "/", changefreq: "weekly", priority: 1 }],
    sources: [
      // Keep imports inside the function so `submit` never loads your data.
      async () => {
        const { getAllPosts, getAllTags } = await import("./src/lib/posts.mjs");
        const posts = getAllPosts();
        const latest = posts[0]?.updated ?? posts[0]?.date;
        return [
          {
            path: "/blog",
            changefreq: "weekly",
            priority: 0.8,
            lastmod: latest,
          },
          ...posts.map((p) => ({
            path: `/blog/${p.slug}`,
            lastmod: p.updated ?? p.date,
            changefreq: "monthly",
            priority: 0.8,
          })),
          // Tag archives with fewer than 3 posts are noindex (see tag page).
          ...getAllTags()
            .filter((t) => t.count >= 3)
            .map((t) => ({ path: `/blog/tag/${t.slug}`, priority: 0.4 })),
        ];
      },
      async () => {
        const { INDEXABLE_TECH_IDS } =
          await import("./src/data/techContent.mjs");
        return [
          { path: "/tech", changefreq: "weekly", priority: 0.7 },
          ...INDEXABLE_TECH_IDS.map((id) => ({
            path: `/tech/${id}`,
            changefreq: "monthly",
            priority: 0.6,
          })),
        ];
      },
    ],
    // Kept out of the sitemap: exact paths, "*" wildcards or RegExps.
    exclude: ["/admin", "/admin/*", "/blog/rss.xml"],
    defaults: { changefreq: "weekly", priority: 0.7 },
  },

  sitemap: true,

  robots: {
    // "allow" (explicit Allow groups), "block", false, or ["GPTBot", …]
    aiCrawlers: "allow",
    disallow: ["/admin", "/api/admin"],
  },

  llms: {
    sections: async () => {
      const { getAllPosts } = await import("./src/lib/posts.mjs");
      return [
        {
          title: "Docs",
          links: [
            {
              title: "Stack Fingerprint",
              path: "/",
              description:
                "Paste a GitHub repo URL, detect its stack and configure the card.",
            },
            {
              title: "Card API",
              path: "/api/card?repo=OWNER/REPO",
              description:
                "SVG card endpoint. Options: theme, layout, size, categoryFilter, path (monorepo subfolder).",
            },
            {
              title: "README",
              url: "https://github.com/mattqdev/stackfingerprint#readme",
              description: "Full usage, themes and options.",
            },
            {
              title: "GitHub Action",
              url: "https://github.com/mattqdev/stackfingerprint-action",
              description:
                "Commits an up-to-date stack card to your repo's README.",
            },
          ],
        },
        {
          title: "Blog",
          links: getAllPosts().map((p) => ({
            title: p.title,
            path: `/blog/${p.slug}`,
            description: p.description,
          })),
        },
        {
          title: "Technologies",
          links: [
            {
              title: "Supported technologies",
              path: "/tech",
              description:
                "Every framework, language, database and tool the scanner detects, with the files and dependencies used for each.",
            },
          ],
        },
      ];
    },
  },

  indexing: {
    // Public by design: generate serves it as /2780e666619b33997cce404258d346e4.txt.
    indexnow: { key: "2780e666619b33997cce404258d346e4" },
  },
};
