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
      // async () => {
      //   const { posts } = await import("./data/posts.js");
      //   return posts.map((p) => ({ path: `/blog/${p.slug}`, lastmod: p.updated ?? p.date }));
      // },
    ],
    // Kept out of the sitemap: exact paths, "*" wildcards or RegExps.
    exclude: ["/admin", "/admin/*"],
    defaults: { changefreq: "weekly", priority: 0.7 },
  },

  sitemap: true,

  robots: {
    // "allow" (explicit Allow groups), "block", false, or ["GPTBot", …]
    aiCrawlers: "allow",
    disallow: ["/admin", "/api/admin"],
  },

  llms: {
    sections: async () => [
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
    ],
  },

  indexing: {
    // Public by design: generate serves it as /2780e666619b33997cce404258d346e4.txt.
    indexnow: { key: "2780e666619b33997cce404258d346e4" },
  },
};
