// src/lib/detect.js
import { SIGNALS, EXT_LANGS, CATEGORY_META } from "../data/signals";
import { fetchTree } from "./github";

// ── Dependency → signal ID mapping ────────────────────────────────────────
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
  tailwindcss: "tailwind",
  "@radix-ui/react-primitive": "radix",
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
  "@babel/core": "babel",

  // Testing
  jest: "jest",
  vitest: "vitest",
  cypress: "cypress",
  "@playwright/test": "playwright",
  playwright: "playwright",
  "@storybook/react": "storybook",
  "@storybook/nextjs": "storybook",
  mocha: "mocha",

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
  "better-sqlite3": "sqlite",
  "@libsql/client": "turso",
  convex: "convex",
  "@neondatabase/serverless": "neon",
  "@neon-tech/serverless": "neon",
  clickhouse: "clickhouse",
  elasticsearch: "elasticsearch",

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
  "dd-trace": "datadog",
  "posthog-js": "posthog",
  posthog: "posthog",

  // AI / ML
  langchain: "langchain",
  "@langchain/core": "langchain",
  openai: "openai",
  "@huggingface/inference": "huggingface",
  ollama: "ollama",

  // Linting / Formatting
  eslint: "eslint",
  prettier: "prettier",
  "@biomejs/biome": "biome",
  stylelint: "stylelint",
  husky: "husky",
};

// ── Python dependency → signal ID ─────────────────────────────────────────
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
  redis: "redis",
  psycopg2: "postgresql",
  "psycopg2-binary": "postgresql",
  asyncpg: "postgresql",
  pymongo: "mongodb",
  motor: "mongodb",
};

// ── Ruby Gemfile → signal ID ───────────────────────────────────────────────
const RUBY_DEP_SIGNALS = {
  rails: "rails",
  "ruby-on-rails": "rails",
  rspec: "rspec",
  "rspec-rails": "rspec",
  rubocop: "rubocop",
};

// ── PHP composer.json → signal ID ─────────────────────────────────────────
const PHP_DEP_SIGNALS = {
  "laravel/framework": "laravel",
  "symfony/symfony": "symfony",
  "symfony/framework-bundle": "symfony",
};

// ── Parse helpers ──────────────────────────────────────────────────────────
function parsePkgJsonDeps(content) {
  try {
    const pkg = JSON.parse(content);
    return Object.keys({
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    });
  } catch {
    return [];
  }
}

function parsePythonDeps(content) {
  const deps = [];
  content.split("\n").forEach((line) => {
    const trimmed = line.trim().toLowerCase();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("-")) return;
    const match = trimmed.match(/^([a-z0-9_\-.]+)/);
    if (match) deps.push(match[1]);
  });
  return deps;
}

function parsePyprojectDeps(content) {
  const deps = [];
  content.split("\n").forEach((line) => {
    const match = line.match(/^\s*["']?([a-zA-Z0-9_\-.]+)["']?\s*[>=<!]/);
    if (match) deps.push(match[1].toLowerCase());
  });
  return deps;
}

function parseGemfileDeps(content) {
  const deps = [];
  content.split("\n").forEach((line) => {
    const match = line.match(/^\s*gem\s+['"]([^'"]+)['"]/);
    if (match) deps.push(match[1].toLowerCase());
  });
  return deps;
}

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
      if (!signalId) continue;
      if (lower === pattern || lower.startsWith(pattern + "/")) {
        if (signalsById.has(signalId)) found.add(signalId);
        break;
      }
    }
    // Detect TypeScript from @types/* or "typescript" package
    if (lower.startsWith("@types/") || lower === "typescript") {
      found.add("typescript");
    }
  }
  return found;
}

// ── Files we want to fetch content for (dep scanning) ─────────────────────
const DEP_FILES = new Set([
  "package.json",
  "requirements.txt",
  "requirements-dev.txt",
  "requirements-prod.txt",
  "pyproject.toml",
  "Gemfile",
  "composer.json",
  "go.mod",
  "Pipfile",
]);

// ── Fallback: root + key-subdir strategy ──────────────────────────────────
// Used only when the Trees API fails (permissions, network error, etc.)
const KEY_SUBDIRS = new Set([
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
]);

async function fallbackPaths(owner, repo, fetchFn) {
  const paths = [];
  try {
    const root = await fetchFn(owner, repo);
    root.forEach((f) => paths.push(f.name));
    const subdirs = root.filter(
      (f) => f.type === "dir" && KEY_SUBDIRS.has(f.name)
    );
    await Promise.allSettled(
      subdirs.map(async (d) => {
        try {
          const sub = await fetchFn(owner, repo, d.path);
          sub.forEach((f) => paths.push(`${d.name}/${f.name}`));
          paths.push(d.name);
        } catch {}
      })
    );
  } catch {}
  return paths;
}

// ── Main export ────────────────────────────────────────────────────────────
export async function detectStack(owner, repo, fetchFn) {
  const signalsById = new Map(SIGNALS.map((s) => [s.id, s]));
  const detected = new Map();

  // ── Step 1: Fetch the full file tree (2 API calls total) ─────────────────
  // GET /repos/{owner}/{repo}           → learn default branch name
  // GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1 → all file paths
  //
  // For repos with >100k objects GitHub truncates the result; we log a warning
  // but still process whatever we got — it covers the vast majority of repos.
  let allPaths = [];

  try {
    const { tree, truncated } = await fetchTree(owner, repo);
    allPaths = tree.map((entry) => entry.path);
    if (truncated) {
      console.warn(
        `[detect] Tree truncated for ${owner}/${repo} (>100k objects)`
      );
    }
  } catch {
    // Trees API unavailable — fall back to the old root + key-subdir scan
    allPaths = await fallbackPaths(owner, repo, fetchFn);
  }

  // ── Step 2: Filename-based signal matching ────────────────────────────────
  // Match each full path AND its bare filename so signal checks written for
  // bare names (e.g. "Dockerfile", "next.config.ts") still fire correctly
  // even when the file is inside a subdirectory.
  const seenBare = new Set();

  for (const fullPath of allPaths) {
    const bare = fullPath.includes("/") ? fullPath.split("/").pop() : fullPath;

    // Full-path check — catches dir-name signals like ".github", "prisma", "k8s"
    for (const sig of SIGNALS) {
      if (!detected.has(sig.id) && sig.check(fullPath)) {
        detected.set(sig.id, sig);
      }
    }

    // Bare-filename check (deduplicated per unique basename to avoid N² work)
    if (!seenBare.has(bare)) {
      seenBare.add(bare);

      for (const sig of SIGNALS) {
        if (!detected.has(sig.id) && sig.check(bare)) {
          detected.set(sig.id, sig);
        }
      }

      // Extension → language
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
  }

  // ── Step 3: Dependency-file content scanning ──────────────────────────────
  // Find every dep file anywhere in the tree; prefer the shallowest copy
  // (root package.json beats src/package.json).
  const depFileUrls = new Map(); // bare filename → { depth, url }

  for (const fullPath of allPaths) {
    const bare = fullPath.includes("/") ? fullPath.split("/").pop() : fullPath;

    if (!DEP_FILES.has(bare)) continue;

    const depth = fullPath.split("/").length;
    const existing = depFileUrls.get(bare);
    if (!existing || depth < existing.depth) {
      depFileUrls.set(bare, {
        depth,
        // raw.githubusercontent.com serves file contents without auth and
        // without counting against the API rate limit.
        url: `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${fullPath}`,
      });
    }
  }

  await Promise.allSettled(
    [...depFileUrls.entries()].map(async ([filename, { url }]) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const content = await res.text();

        if (filename === "package.json") {
          const deps = parsePkgJsonDeps(content);
          for (const id of resolveNpmDeps(deps, signalsById)) {
            if (!detected.has(id)) detected.set(id, signalsById.get(id));
          }
        } else if (
          filename === "requirements.txt" ||
          filename === "requirements-dev.txt" ||
          filename === "requirements-prod.txt" ||
          filename === "Pipfile"
        ) {
          for (const dep of parsePythonDeps(content)) {
            const id = PYTHON_DEP_SIGNALS[dep];
            if (id && !detected.has(id) && signalsById.has(id))
              detected.set(id, signalsById.get(id));
          }
        } else if (filename === "pyproject.toml") {
          for (const dep of parsePyprojectDeps(content)) {
            const id = PYTHON_DEP_SIGNALS[dep];
            if (id && !detected.has(id) && signalsById.has(id))
              detected.set(id, signalsById.get(id));
          }
        } else if (filename === "Gemfile") {
          for (const dep of parseGemfileDeps(content)) {
            const id = RUBY_DEP_SIGNALS[dep];
            if (id && !detected.has(id) && signalsById.has(id))
              detected.set(id, signalsById.get(id));
          }
        } else if (filename === "composer.json") {
          for (const dep of parseComposerDeps(content)) {
            const id = PHP_DEP_SIGNALS[dep];
            if (id && !detected.has(id) && signalsById.has(id))
              detected.set(id, signalsById.get(id));
          }
        } else if (filename === "go.mod") {
          content.split("\n").forEach((line) => {
            const t = line.trim();
            if (t.includes("gin-gonic/gin") && !detected.has("gin"))
              detected.set("gin", signalsById.get("gin"));
            if (t.includes("gofiber/fiber") && !detected.has("fiber"))
              detected.set("fiber", signalsById.get("fiber"));
          });
        }
      } catch {
        // Dep scanning is best-effort — silently skip failures
      }
    })
  );

  // ── Step 4: Sort by category order ────────────────────────────────────────
  const catOrder = Object.fromEntries(
    Object.entries(CATEGORY_META).map(([k, v]) => [k, v.order])
  );

  return [...detected.values()].sort(
    (a, b) => (catOrder[a.category] ?? 99) - (catOrder[b.category] ?? 99)
  );
}
