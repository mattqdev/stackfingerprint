// src/lib/detect.js
import { SIGNALS, EXT_LANGS, CATEGORY_META } from "../data/signals";

const KEY_SUBDIRS = [
  "src",
  "app",
  "pages",
  "lib",
  "prisma",
  "terraform",
  ".github",
  ".circleci",
  "supabase",
  "src-tauri",
  ".storybook",
  "config",
  "scripts",
  "infra",
  "deploy",
  "k8s",
  "kubernetes",
  ".husky",
  "convex",
  "pocketbase",
  "spec",
  "test",
  "tests",
  "__tests__",
  "migrations",
  "db",
  "database",
  "ci",
  ".woodpecker",
];

// ── Dependency → signal ID mapping ────────────────────────────────────────
// Maps npm/pip/composer/etc. package names to signal IDs.
// Keys are lowercase package name patterns (substring match).
const DEP_SIGNALS = {
  // Frameworks
  next: "nextjs",
  nuxt: "nuxt",
  "@sveltejs/kit": "sveltekit",
  "@remix-run/react": "remix",
  "@remix-run/node": "remix",
  "@angular/core": "angular",
  astro: "astro",
  gatsby: "gatsby",
  expo: "expo",
  "@nestjs/core": "nestjs",
  hono: "hono",
  express: "express",
  fastify: "fastify",
  "@trpc/server": "trpc",
  "@trpc/client": "trpc",
  vue: "vue",
  react: "react",
  "solid-js": "solidjs",
  "@builder.io/qwik": "qwik",
  electron: "electron",
  "@capacitor/core": "capacitor",
  "react-native": "reactnative",

  // UI Libraries
  "@shadcn/ui": "shadcn",
  tailwindcss: "tailwind",
  "@radix-ui/react": "radix",
  "@mui/material": "mui",
  "@material-ui/core": "mui",
  "@chakra-ui/react": "chakra",
  antd: "antdesign",
  "@ant-design/icons": "antdesign",
  "styled-components": "styledcomponents",
  bootstrap: "bootstrap",
  daisyui: "daisyui",
  sass: "sass",
  "framer-motion": "framermotion",

  // Build tools
  vite: "vite",
  webpack: "webpack",
  rollup: "rollup",
  esbuild: "esbuild",
  turbo: "turbo",
  parcel: "parcel",
  tsup: "tsup",
  "@swc/core": "swc",
  "@swc/cli": "swc",
  babel: "babel",
  "@babel/core": "babel",

  // Testing
  jest: "jest",
  vitest: "vitest",
  cypress: "cypress",
  "@playwright/test": "playwright",
  playwright: "playwright",
  storybook: "storybook",
  "@storybook/react": "storybook",
  mocha: "mocha",
  pytest: "pytest",

  // Databases / ORM
  "@prisma/client": "prisma",
  prisma: "prisma",
  "drizzle-orm": "drizzle",
  "@supabase/supabase-js": "supabase",
  firebase: "firebase",
  "firebase-admin": "firebase",
  redis: "redis",
  ioredis: "redis",
  mongoose: "mongodb",
  pg: "postgresql",
  postgres: "postgresql",
  mysql2: "mysql",
  mysql: "mysql",
  "better-sqlite3": "sqlite",
  "@libsql/client": "turso",
  convex: "convex",
  "@neon-tech/serverless": "neon",
  "@neondatabase/serverless": "neon",
  clickhouse: "clickhouse",
  elasticsearch: "elasticsearch",
  sqlalchemy: "sqlalchemy",

  // Auth
  "next-auth": "nextauth",
  "@auth/core": "nextauth",
  "@clerk/nextjs": "clerk",
  "@clerk/clerk-sdk-node": "clerk",
  lucia: "lucia",
  "@auth0/nextjs-auth0": "auth0",
  auth0: "auth0",

  // State management
  redux: "redux",
  "@reduxjs/toolkit": "redux",
  zustand: "zustand",
  jotai: "jotai",
  mobx: "mobx",
  xstate: "xstate",

  // Monitoring
  "@sentry/nextjs": "sentry",
  "@sentry/node": "sentry",
  "@sentry/react": "sentry",
  sentry: "sentry",
  "dd-trace": "datadog",
  posthog: "posthog",
  "posthog-js": "posthog",

  // AI / ML
  langchain: "langchain",
  "@langchain/core": "langchain",
  openai: "openai",
  "@huggingface/inference": "huggingface",
  ollama: "ollama",

  // Infra
  "@vercel/analytics": "vercel",

  // Linting / Formatting
  eslint: "eslint",
  prettier: "prettier",
  "@biomejs/biome": "biome",
  biome: "biome",
  stylelint: "stylelint",
  husky: "husky",
};

// ── Python dependency patterns ─────────────────────────────────────────────
const PYTHON_DEP_SIGNALS = {
  django: "django",
  flask: "flask",
  fastapi: "fastapi",
  uvicorn: "fastapi",
  starlette: "fastapi",
  sqlalchemy: "sqlalchemy",
  alembic: "sqlalchemy",
  pytest: "pytest",
  torch: "pytorch",
  tensorflow: "tensorflow",
  langchain: "langchain",
  openai: "openai",
  transformers: "huggingface",
  celery: null, // no signal yet
  redis: "redis",
  psycopg2: "postgresql",
  pymongo: "mongodb",
  motor: "mongodb",
};

// ── Parse package.json dependencies ───────────────────────────────────────
function parsePkgJsonDeps(content) {
  try {
    const pkg = JSON.parse(content);
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };
    return Object.keys(allDeps);
  } catch {
    return [];
  }
}

// ── Parse requirements.txt / pyproject.toml ────────────────────────────────
function parsePythonDeps(content, filename) {
  const deps = new Set();
  if (filename === "requirements.txt" || filename.startsWith("requirements")) {
    // Parse requirements.txt: each line is "package==version" or "package>=version" etc.
    content.split("\n").forEach((line) => {
      const trimmed = line.trim().toLowerCase();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("-"))
        return;
      const match = trimmed.match(/^([a-z0-9_\-.]+)/);
      if (match) deps.add(match[1]);
    });
  } else if (filename === "pyproject.toml") {
    // Basic TOML parsing for dependencies
    content.split("\n").forEach((line) => {
      const match = line.match(/"([a-z0-9_\-.]+)/i);
      if (match) deps.add(match[1].toLowerCase());
    });
  }
  return [...deps];
}

// ── Parse Gemfile ──────────────────────────────────────────────────────────
const RUBY_DEP_SIGNALS = {
  rails: "rails",
  "ruby-on-rails": "rails",
  rspec: "rspec",
  "rspec-rails": "rspec",
  rubocop: "rubocop",
};

function parseGemfileDeps(content) {
  const deps = [];
  content.split("\n").forEach((line) => {
    const match = line.match(/^\s*gem\s+['"]([^'"]+)['"]/);
    if (match) deps.push(match[1].toLowerCase());
  });
  return deps;
}

// ── Parse composer.json ────────────────────────────────────────────────────
const PHP_DEP_SIGNALS = {
  "laravel/framework": "laravel",
  "symfony/symfony": "symfony",
  "symfony/framework-bundle": "symfony",
  "slim/slim": null,
};

function parseComposerDeps(content) {
  try {
    const pkg = JSON.parse(content);
    return Object.keys({ ...pkg.require, ...pkg["require-dev"] });
  } catch {
    return [];
  }
}

// ── Resolve npm dep names to signal IDs ───────────────────────────────────
function resolveNpmDeps(depNames, signalsById) {
  const found = new Set();
  for (const dep of depNames) {
    const lower = dep.toLowerCase();
    for (const [pattern, signalId] of Object.entries(DEP_SIGNALS)) {
      if (signalId && (lower === pattern || lower.startsWith(pattern + "/"))) {
        if (signalsById.has(signalId)) found.add(signalId);
        break;
      }
    }
  }
  return found;
}

export async function detectStack(owner, repo, fetchFn) {
  const allFiles = new Set();
  // Map from filename → file content (for dep parsing)
  const fileContents = new Map();

  // ── Fetch root ─────────────────────────────────────────────────────────
  const root = await fetchFn(owner, repo);
  root.forEach((f) => {
    allFiles.add(f.name);
    // Track downloadable content files
    if (
      [
        "package.json",
        "requirements.txt",
        "pyproject.toml",
        "Gemfile",
        "composer.json",
        "go.mod",
        "Cargo.toml",
        "go.sum",
      ].includes(f.name) &&
      f.download_url
    ) {
      fileContents.set(f.name, f.download_url);
    }
  });

  // ── Fetch key subdirectories ───────────────────────────────────────────
  const subdirs = root.filter(
    (f) => f.type === "dir" && KEY_SUBDIRS.includes(f.name)
  );

  await Promise.allSettled(
    subdirs.map(async (d) => {
      try {
        const sub = await fetchFn(owner, repo, d.path);
        sub.forEach((f) => {
          allFiles.add(f.name);
          allFiles.add(`${d.name}/${f.name}`); // also add with parent prefix for path-based checks
          if (
            f.name === "package.json" &&
            f.download_url &&
            !fileContents.has("package.json")
          ) {
            fileContents.set("package.json", f.download_url);
          }
        });
        allFiles.add(d.name); // dir itself is a signal
      } catch {}
    })
  );

  // ── Build signal lookup ────────────────────────────────────────────────
  const signalsById = new Map(SIGNALS.map((s) => [s.id, s]));

  // ── Filename-based detection ───────────────────────────────────────────
  const detected = new Map();

  for (const filename of allFiles) {
    // Check against the bare filename (last segment)
    const bare = filename.includes("/") ? filename.split("/").pop() : filename;

    for (const sig of SIGNALS) {
      if (!detected.has(sig.id) && sig.check(bare)) {
        detected.set(sig.id, sig);
      }
    }

    // Also check full path for path-sensitive signals
    if (filename.includes("/")) {
      for (const sig of SIGNALS) {
        if (!detected.has(sig.id) && sig.check(filename)) {
          detected.set(sig.id, sig);
        }
      }
    }

    // Extension-based language detection
    const dot = bare.lastIndexOf(".");
    if (dot !== -1) {
      const ext = bare.slice(dot).toLowerCase();
      for (const lang of EXT_LANGS) {
        if (!detected.has(lang.id) && lang.exts.includes(ext)) {
          detected.set(lang.id, lang);
        }
      }
    }
  }

  // ── Dependency-file-based detection ───────────────────────────────────
  const depFetches = [];

  for (const [filename, url] of fileContents.entries()) {
    depFetches.push(
      fetch(url)
        .then((r) => (r.ok ? r.text() : null))
        .then((content) => {
          if (!content) return;

          if (filename === "package.json") {
            const deps = parsePkgJsonDeps(content);
            const resolvedIds = resolveNpmDeps(deps, signalsById);
            for (const id of resolvedIds) {
              if (!detected.has(id)) {
                detected.set(id, signalsById.get(id));
              }
            }
            // Also detect TypeScript if @types/* packages present
            if (
              deps.some((d) => d.startsWith("@types/") || d === "typescript")
            ) {
              if (!detected.has("typescript")) {
                const tsSig = EXT_LANGS.find((l) => l.id === "typescript");
                if (tsSig) detected.set("typescript", tsSig);
              }
            }
          } else if (
            filename === "requirements.txt" ||
            filename === "pyproject.toml"
          ) {
            const deps = parsePythonDeps(content, filename);
            for (const dep of deps) {
              const signalId = PYTHON_DEP_SIGNALS[dep];
              if (
                signalId &&
                !detected.has(signalId) &&
                signalsById.has(signalId)
              ) {
                detected.set(signalId, signalsById.get(signalId));
              }
            }
          } else if (filename === "Gemfile") {
            const deps = parseGemfileDeps(content);
            for (const dep of deps) {
              const signalId = RUBY_DEP_SIGNALS[dep];
              if (
                signalId &&
                !detected.has(signalId) &&
                signalsById.has(signalId)
              ) {
                detected.set(signalId, signalsById.get(signalId));
              }
            }
          } else if (filename === "composer.json") {
            const deps = parseComposerDeps(content);
            for (const dep of deps) {
              const signalId = PHP_DEP_SIGNALS[dep];
              if (
                signalId &&
                !detected.has(signalId) &&
                signalsById.has(signalId)
              ) {
                detected.set(signalId, signalsById.get(signalId));
              }
            }
          } else if (filename === "go.mod") {
            // Detect gin, fiber, echo etc. from go.mod requires
            content.split("\n").forEach((line) => {
              const trimmed = line.trim();
              if (trimmed.includes("gin-gonic/gin"))
                detected.set("gin", signalsById.get("gin"));
              if (trimmed.includes("gofiber/fiber"))
                detected.set("fiber", signalsById.get("fiber"));
              if (trimmed.includes("labstack/echo")) {
                // echo not in signals but could be added
              }
            });
          }
        })
        .catch(() => null)
    );
  }

  await Promise.allSettled(depFetches);

  // ── Sort by category order ─────────────────────────────────────────────
  const catOrder = Object.fromEntries(
    Object.entries(CATEGORY_META).map(([k, v]) => [k, v.order])
  );

  return [...detected.values()].sort(
    (a, b) => (catOrder[a.category] ?? 99) - (catOrder[b.category] ?? 99)
  );
}
