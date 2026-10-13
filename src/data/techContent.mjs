// src/data/techContent.mjs
// Hand-written copy for /tech/[id]. Only technologies listed here are indexed
// (and included in the sitemap); the rest render with `noindex, follow` until
// they get an entry. Plain data so site-seo-kit can import it at build time.
//
// intro:   what it is, in one or two sentences (unique per page — no templates)
// readme:  why it's worth showing on a README card
// example: a public repo that uses it, rendered as a live card on the page

export const TECH_CONTENT = {
  nextjs: {
    intro:
      "Next.js is Vercel's React framework for full-stack web apps: file-based routing, server components, static generation and API routes in one package.",
    readme:
      "Contributors immediately know whether to expect the App Router, server actions or a classic Pages setup, so it's one of the first things worth surfacing.",
    example: "vercel/commerce",
  },
  react: {
    intro:
      "React is Meta's component library for building user interfaces, and the base layer of Next.js, Remix, Expo and most of the modern frontend ecosystem.",
    readme:
      "React shows up in a huge share of JavaScript repos; listing it next to the framework and state library tells a reader exactly which flavour of React app they're looking at.",
    example: "excalidraw/excalidraw",
  },
  vue: {
    intro:
      "Vue is a progressive JavaScript framework with single-file components, a reactive core and an official router and state solution (Pinia).",
    readme:
      "Vue repos often pair it with Nuxt, Vite or Quasar; a card shows the whole combination instead of a lone Vue badge.",
    example: "vuejs/core",
  },
  sveltekit: {
    intro:
      "SvelteKit is the application framework for Svelte, adding routing, server-side rendering and adapters for every major host.",
    readme:
      "Svelte projects are easy to mistake for plain Vite apps; the svelte.config file is the tell, and the card picks it up automatically.",
    example: "sveltejs/kit",
  },
  astro: {
    intro:
      "Astro is a content-first web framework that ships zero JavaScript by default and lets you mix React, Vue, Svelte and Solid islands on the same page.",
    readme:
      "Astro sites frequently include several UI frameworks at once, exactly the kind of mixed stack a generated card captures better than hand-picked badges.",
    example: "withastro/astro",
  },
  nuxt: {
    intro:
      "Nuxt is the full-stack framework for Vue, with file-based routing, server routes via Nitro and hybrid rendering.",
    readme:
      "Showing Nuxt (not just Vue) signals SSR, server routes and the Nuxt module ecosystem to anyone browsing the repo.",
    example: "nuxt/nuxt",
  },
  remix: {
    intro:
      "Remix is a full-stack React framework built around web standards, nested routes and loaders/actions, now merged into React Router v7.",
    readme:
      "Because Remix and React Router overlap, a card that reads the actual dependencies is more reliable than a badge someone typed two versions ago.",
    example: "remix-run/remix",
  },
  angular: {
    intro:
      "Angular is Google's batteries-included TypeScript framework with dependency injection, signals, a CLI and a full router and forms story.",
    readme:
      "Angular projects usually come with a specific testing and build toolchain; the card lists them alongside the framework.",
    example: "angular/angular",
  },
  express: {
    intro:
      "Express is the minimal, unopinionated web server framework for Node.js and still the most common base for JavaScript APIs.",
    readme:
      "Backend repos rarely advertise their server framework; detecting Express from package.json makes the API side of a project visible.",
    example: "expressjs/express",
  },
  nestjs: {
    intro:
      "NestJS is a structured Node.js framework for server-side apps, using TypeScript decorators, modules and dependency injection.",
    readme:
      "Nest implies a particular architecture (modules, providers, guards); listing it sets expectations for contributors before they open the code.",
    example: "nestjs/nest",
  },
  hono: {
    intro:
      "Hono is a small, fast web framework built on Web Standards that runs on Cloudflare Workers, Deno, Bun, Node and other edge runtimes.",
    readme:
      "Hono apps usually target a specific runtime; the card shows Hono together with Bun, Deno or Cloudflare when they're present.",
    example: "honojs/hono",
  },
  fastapi: {
    intro:
      "FastAPI is a modern Python web framework for building APIs with type hints, automatic OpenAPI docs and async support.",
    readme:
      "Python projects hide their framework in requirements.txt or pyproject.toml; Stack Fingerprint reads both so FastAPI shows up without a hand-made badge.",
    example: "fastapi/full-stack-fastapi-template",
  },
  django: {
    intro:
      "Django is the 'batteries included' Python web framework, with an ORM, admin panel, auth and migrations out of the box.",
    readme:
      "A Django card tells contributors to expect manage.py, migrations and the Django ORM, and lists the database and tooling around it.",
    example: "django/djangoproject.com",
  },
  laravel: {
    intro:
      "Laravel is the most popular PHP framework, with Eloquent ORM, queues, Blade templates and a large first-party ecosystem.",
    readme:
      "Laravel apps usually combine PHP, Composer, Vite and a JS framework; a card shows the whole full-stack picture at once.",
    example: "laravel/laravel",
  },
  rails: {
    intro:
      "Ruby on Rails is the convention-over-configuration web framework for Ruby, with Active Record, Hotwire and generators.",
    readme:
      "Rails repos are detected from their Gemfile and config layout, so the card stays correct as gems are added or removed.",
    example: "rails/rails",
  },
  tailwind: {
    intro:
      "Tailwind CSS is a utility-first CSS framework where you style elements with small composable classes directly in your markup.",
    readme:
      "Tailwind is one of the most-requested README badges; detecting it from the config file or dependency means it never goes stale when you upgrade to v4.",
    example: "shadcn-ui/ui",
  },
  shadcn: {
    intro:
      "shadcn/ui is a collection of copy-paste React components built on Radix UI and Tailwind, owned by your codebase rather than installed as a library.",
    readme:
      "Since shadcn/ui isn't a regular npm dependency, it's easy to forget in a badge list; its components.json file makes it detectable.",
    example: "shadcn-ui/taxonomy",
  },
  vite: {
    intro:
      "Vite is a fast frontend build tool and dev server powered by native ES modules in development and Rollup/Rolldown for production builds.",
    readme:
      "Many projects migrated from Webpack to Vite and never updated their badges. Reading vite.config keeps the build tool on the card accurate.",
    example: "vitejs/vite",
  },
  webpack: {
    intro:
      "webpack is the long-standing JavaScript module bundler with a huge loader and plugin ecosystem.",
    readme:
      "Knowing a project is still on webpack matters to contributors used to Vite or Turbopack; the card surfaces it from the config file.",
    example: "webpack/webpack",
  },
  turbo: {
    intro:
      "Turborepo is a high-performance build system for JavaScript and TypeScript monorepos, with task caching and remote caching.",
    readme:
      "Monorepos are where stack cards shine: Turborepo plus the apps inside it. Use the `path` option to render a card per package.",
    example: "vercel/turborepo",
  },
  docker: {
    intro:
      "Docker packages applications and their dependencies into containers, defined by a Dockerfile and often orchestrated with Docker Compose.",
    readme:
      "A Docker signal tells users the project can be run with a single `docker compose up`, often the fastest way to try it.",
    example: "docker/awesome-compose",
  },
  kubernetes: {
    intro:
      "Kubernetes is the container orchestration platform for deploying, scaling and managing containerised workloads across clusters.",
    readme:
      "Infrastructure is the most under-documented part of most stacks; k8s/ folders, *.k8s.yaml manifests and kustomization files are picked up from the file tree.",
    example: "kubernetes/examples",
  },
  node: {
    intro:
      "Node.js is the JavaScript runtime built on V8 that powers most server-side JavaScript, CLIs and build tooling.",
    readme:
      "The card shows Node alongside the package manager (npm, pnpm, Yarn or Bun) so contributors know which lockfile to respect.",
    example: "nodejs/node",
  },
  deno: {
    intro:
      "Deno is a secure-by-default JavaScript and TypeScript runtime with built-in tooling, npm compatibility and a standard library.",
    readme:
      "Deno projects look different (deno.json, no node_modules), so flagging the runtime saves contributors a confused first `npm install`.",
    example: "denoland/fresh",
  },
  "bun-runtime": {
    intro:
      "Bun is an all-in-one JavaScript runtime, bundler, test runner and package manager focused on speed.",
    readme:
      "Bun can be used as just a package manager or as the full runtime; the card distinguishes the two from the lockfile and config.",
    example: "oven-sh/bun",
  },
  typescript: {
    intro:
      "TypeScript is JavaScript with static types, compiled to plain JavaScript and used by most large JS codebases today.",
    readme:
      "Language detection is based on actual file extensions, so the card reflects how much of the repo really is TypeScript.",
    example: "microsoft/TypeScript",
  },
  javascript: {
    intro:
      "JavaScript is the language of the web, running in every browser and on servers via Node.js, Deno and Bun.",
    readme:
      "Detected from .js/.jsx/.mjs/.cjs files, so mixed JS and TS repos show both languages.",
    example: "lodash/lodash",
  },
  python: {
    intro:
      "Python is a general-purpose language dominant in data science, machine learning, scripting and backend web development.",
    readme:
      "Stack Fingerprint reads requirements.txt, pyproject.toml and Pipfile, so a Python card also shows the framework, package manager (pip, Poetry, uv) and ML libraries.",
    example: "psf/requests",
  },
  rust: {
    intro:
      "Rust is a systems programming language focused on memory safety and performance without a garbage collector, built with Cargo.",
    readme:
      "Rust projects often embed WebAssembly or a Tauri frontend; the card shows the full combination from Cargo.toml and the file tree.",
    example: "tauri-apps/tauri",
  },
  golang: {
    intro:
      "Go is Google's compiled language for simple, concurrent, statically linked services and CLIs.",
    readme:
      "Go repos are detected from go.mod; the card adds the Docker, Kubernetes and CI signals that usually come with Go services.",
    example: "gin-gonic/gin",
  },
  prisma: {
    intro:
      "Prisma is a TypeScript ORM with a declarative schema, generated type-safe client and migration tooling.",
    readme:
      "The database layer is rarely in the badge list. Prisma is detected from schema.prisma and the dependency, next to the database it targets.",
    example: "prisma/prisma-examples",
  },
  drizzle: {
    intro:
      "Drizzle ORM is a lightweight, SQL-like TypeScript ORM with zero runtime dependencies and first-class serverless support.",
    readme:
      "Drizzle is often paired with Neon, Turso or Supabase; the card picks up drizzle.config and shows the whole data layer.",
    example: "drizzle-team/drizzle-orm",
  },
  supabase: {
    intro:
      "Supabase is an open-source Postgres development platform with auth, storage, realtime and edge functions.",
    readme:
      "A supabase/ folder or the @supabase/supabase-js dependency is enough to show it on the card, so readers know auth and data live in Supabase.",
    example: "supabase/supabase",
  },
  firebase: {
    intro:
      "Firebase is Google's app development platform with Firestore, authentication, hosting, cloud functions and analytics.",
    readme:
      "firebase.json and the SDK dependency are detected automatically, so a Firebase-backed app shows its backend at a glance.",
    example: "firebase/friendlyeats-web",
  },
  postgresql: {
    intro:
      "PostgreSQL is the advanced open-source relational database, known for reliability, extensions and standards compliance.",
    readme:
      "Showing Postgres next to the ORM (Prisma, Drizzle, SQLAlchemy) gives a complete picture of the persistence layer.",
    example: "postgres/postgres",
  },
  mongodb: {
    intro:
      "MongoDB is a document database storing JSON-like documents, widely used with Node.js through the official driver or Mongoose.",
    readme:
      "Detected from the driver or Mongoose dependency, MongoDB on the card tells contributors to expect a document model rather than SQL.",
    example: "mongodb/node-mongodb-native",
  },
  redis: {
    intro:
      "Redis is an in-memory data store used as a cache, message broker, rate limiter and session store.",
    readme:
      "Caches and queues are invisible from the outside; listing Redis explains part of the runtime architecture.",
    example: "redis/node-redis",
  },
  jest: {
    intro:
      "Jest is a JavaScript testing framework with built-in mocking, snapshots and coverage.",
    readme:
      "Showing the test runner tells contributors how to run the suite before they open package.json.",
    example: "jestjs/jest",
  },
  vitest: {
    intro:
      "Vitest is a Vite-native test runner with a Jest-compatible API, fast watch mode and in-source testing.",
    readme:
      "Test runners are always treated as dev-only, so you can show them with `categoryFilter=devtools` or hide them with `prodonly`.",
    example: "vitest-dev/vitest",
  },
  playwright: {
    intro:
      "Playwright is Microsoft's end-to-end testing framework for Chromium, Firefox and WebKit, with auto-waiting and trace viewer.",
    readme:
      "E2E coverage is a quality signal; playwright.config is detected so the card shows the project is tested in real browsers.",
    example: "microsoft/playwright",
  },
  "github-actions": {
    intro:
      "GitHub Actions is GitHub's built-in CI/CD, running workflows defined in .github/workflows on every push, PR or schedule.",
    readme:
      "The Stack Fingerprint Action itself runs here: it regenerates your card on every push and commits it to the repo.",
    example: "actions/starter-workflows",
  },
  vercel: {
    intro:
      "Vercel is a frontend cloud platform for deploying Next.js and other frameworks with previews on every pull request.",
    readme:
      "A vercel.json in the repo means a deploy target; the card adds it to the infra section so readers know where the app lives.",
    example: "vercel/next.js",
  },
  terraform: {
    intro:
      "Terraform is HashiCorp's infrastructure-as-code tool for provisioning cloud resources from declarative .tf files.",
    readme:
      "Infrastructure-as-code is a big part of what a project actually depends on; .tf files are detected and grouped under infra.",
    example: "hashicorp/terraform",
  },
  eslint: {
    intro:
      "ESLint is the pluggable linter for JavaScript and TypeScript, enforcing code quality and style rules.",
    readme:
      "Linters are flagged as dev-only, so the `prodonly` filter hides them while the `devtools` filter puts them front and centre.",
    example: "eslint/eslint",
  },
  pnpm: {
    intro:
      "pnpm is a fast, disk-efficient package manager for Node.js that uses a content-addressable store and strict node_modules.",
    readme:
      "pnpm is detected from pnpm-lock.yaml or pnpm-workspace.yaml, telling contributors to avoid running npm install.",
    example: "pnpm/pnpm",
  },
  langchain: {
    intro:
      "LangChain is a framework for building LLM-powered applications with chains, agents, retrieval and tool integrations.",
    readme:
      "AI tooling changes fast; the card reads the actual Python or JS dependencies so the AI section is never out of date.",
    example: "langchain-ai/langchain",
  },
  openai: {
    intro:
      "The OpenAI SDK is the official client for OpenAI's models, available for Python and JavaScript.",
    readme:
      "Detected from the SDK dependency, it shows readers the project calls hosted LLMs, along with any other AI libraries in use.",
    example: "openai/openai-node",
  },
  pytorch: {
    intro:
      "PyTorch is the open-source deep learning framework from Meta, used for research and production machine learning.",
    readme:
      "ML repos combine Python, Jupyter, PyTorch and Hugging Face; the card groups them under AI/ML automatically.",
    example: "pytorch/examples",
  },
};

/** Last edit to the copy above: dateModified / sitemap lastmod for /tech. */
export const TECH_CONTENT_UPDATED = "2026-10-13";

/** Technology ids with hand-written content (indexable pages). */
export const INDEXABLE_TECH_IDS = Object.keys(TECH_CONTENT);
