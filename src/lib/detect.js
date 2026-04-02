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

  // Build tools (dev-only by nature)
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

  // Testing (always dev-only)
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

  // Linting / Formatting (always dev-only)
  eslint: "eslint",
  prettier: "prettier",
  "@biomejs/biome": "biome",
  stylelint: "stylelint",
  husky: "husky",
};

// Signal IDs that are ALWAYS considered dev-only regardless of where they appear
const INHERENTLY_DEV = new Set([
  "jest",
  "vitest",
  "cypress",
  "playwright",
  "storybook",
  "mocha",
  "eslint",
  "prettier",
  "biome",
  "stylelint",
  "husky",
  "ruff",
  "rubocop",
  "commitlint",
  "editorconfig",
  "oxlint",
  "vite",
  "webpack",
  "rollup",
  "esbuild",
  "parcel",
  "tsup",
  "swc",
  "babel",
  "turbo",
  "nx",
  "lerna",
  "changesets",
  "github-actions",
  "circleci",
  "jenkins",
  "gitlab-ci",
  "travisci",
  "drone",
  "woodpecker",
  "argocd",
  "semantic-release",
]);

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

// ── Config file names to try (both with and without .json extension) ──────
// We try both .stackfingerprint.json and .stackfingerprint (no extension)
export const SF_CONFIG_FILES = new Set([
  ".stackfingerprint.json",
  ".stackfingerprint",
]);

// Keep the original export for backward compat
export const SF_CONFIG_FILE = ".stackfingerprint.json";

export function parseSFConfig(content) {
  try {
    const parsed = JSON.parse(content);
    return {
      ignore: new Set(Array.isArray(parsed.ignore) ? parsed.ignore : []),
      pin: Array.isArray(parsed.pin) ? parsed.pin : [],
      labels:
        typeof parsed.labels === "object" && parsed.labels !== null
          ? parsed.labels
          : {},
      path: typeof parsed.path === "string" ? parsed.path : null,
      card: parseSFCardConfig(parsed.card),
    };
  } catch {
    return { ignore: new Set(), pin: [], labels: {}, path: null, card: {} };
  }
}

function parseSFCardConfig(raw) {
  if (!raw || typeof raw !== "object") return {};

  const card = {};

  const STRING_FIELDS = [
    "theme",
    "layout",
    "size",
    "categoryFilter",
    "accentLine",
    "bgDecoration",
  ];
  for (const key of STRING_FIELDS) {
    if (typeof raw[key] === "string") card[key] = raw[key];
  }

  if (typeof raw.iconStyle === "string") {
    card.iconStyle = raw.iconStyle;
  } else if (typeof raw.icons === "string") {
    card.iconStyle = raw.icons;
  }

  if (typeof raw.pillShape === "string") {
    card.pillShape = raw.pillShape;
  } else if (typeof raw.pills === "string") {
    card.pillShape = raw.pills;
  }

  if (raw.dataFields && typeof raw.dataFields === "object") {
    card.dataFields = {};
    const BOOL_FIELDS = [
      "repoName",
      "signalCount",
      "footerUrl",
      "brandLabel",
      "categoryDots",
      "overflowBadge",
    ];
    for (const k of BOOL_FIELDS) {
      if (typeof raw.dataFields[k] === "boolean") {
        card.dataFields[k] = raw.dataFields[k];
      }
    }
    if (Object.keys(card.dataFields).length === 0) delete card.dataFields;
  }

  return card;
}

// ── Parse helpers ──────────────────────────────────────────────────────────
function parsePkgJsonDeps(content) {
  try {
    const pkg = JSON.parse(content);
    const prod = new Set(Object.keys(pkg.dependencies ?? {}));
    const dev = new Set(Object.keys(pkg.devDependencies ?? {}));
    const peer = new Set(Object.keys(pkg.peerDependencies ?? {}));
    return { prod, dev, peer };
  } catch {
    return { prod: new Set(), dev: new Set(), peer: new Set() };
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
function resolveNpmDeps(prodDeps, devDeps, peerDeps, signalsById) {
  const found = new Map();

  const checkDep = (dep, isDev) => {
    const lower = dep.toLowerCase();
    for (const [pattern, signalId] of Object.entries(DEP_SIGNALS)) {
      if (!signalId) continue;
      if (lower === pattern || lower.startsWith(pattern + "/")) {
        if (signalsById.has(signalId)) {
          const alreadyDev = found.get(signalId)?.isDevOnly ?? true;
          found.set(signalId, { isDevOnly: alreadyDev && isDev });
        }
        break;
      }
    }
    if (lower.startsWith("@types/") || lower === "typescript") {
      found.set("typescript", { isDevOnly: isDev });
    }
  };

  for (const dep of prodDeps) checkDep(dep, false);
  for (const dep of peerDeps) checkDep(dep, false);
  for (const dep of devDeps) checkDep(dep, true);

  return found;
}

// ── Files we want to fetch content for ────────────────────────────────────
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
  // Both config file variants
  ".stackfingerprint.json",
  ".stackfingerprint",
]);

// ── Fallback: root + key-subdir strategy ──────────────────────────────────
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

async function fallbackPaths(owner, repo, fetchFn, subPath) {
  const paths = [];
  const scanRoot = subPath || "";
  try {
    const root = await fetchFn(owner, repo, scanRoot);
    root.forEach((f) => paths.push(subPath ? `${subPath}/${f.name}` : f.name));
    const subdirs = root.filter(
      (f) => f.type === "dir" && KEY_SUBDIRS.has(f.name)
    );
    await Promise.allSettled(
      subdirs.map(async (d) => {
        try {
          const sub = await fetchFn(owner, repo, d.path);
          sub.forEach((f) => paths.push(`${d.path}/${f.name}`));
          paths.push(d.path);
        } catch {}
      })
    );
  } catch {}
  return paths;
}

// ── Main export ────────────────────────────────────────────────────────────
// Returns { stack, sfConfig, ignoredStack } instead of just the stack array.
//
// - stack:        signals to show (after applying ignore/pin)
// - sfConfig:     the parsed .stackfingerprint config
// - ignoredStack: signals that were in ignore list (for showIgnored feature)
//
// options.subPath — optional sub-directory to scan (monorepo support)
export async function detectStack(owner, repo, fetchFn, options = {}) {
  const { subPath = "" } = options;

  const signalsById = new Map(SIGNALS.map((s) => [s.id, s]));
  const detected = new Map();

  // ── Step 1: Fetch the full file tree ──────────────────────────────────
  let allPaths = [];

  try {
    const { tree, truncated } = await fetchTree(owner, repo);
    let paths = tree.map((entry) => entry.path);

    if (subPath) {
      const prefix = subPath.replace(/\/$/, "") + "/";
      paths = paths.filter((p) => p === subPath || p.startsWith(prefix));
    }

    allPaths = paths;
    if (truncated) {
      console.warn(
        `[detect] Tree truncated for ${owner}/${repo} (>100k objects)`
      );
    }
  } catch {
    allPaths = await fallbackPaths(owner, repo, fetchFn, subPath);
  }

  // ── Step 2: Filename-based signal matching ────────────────────────────
  const seenBare = new Set();

  for (const fullPath of allPaths) {
    const bare = fullPath.includes("/") ? fullPath.split("/").pop() : fullPath;

    for (const sig of SIGNALS) {
      if (!detected.has(sig.id) && sig.check(fullPath)) {
        detected.set(sig.id, {
          ...sig,
          isDevOnly: INHERENTLY_DEV.has(sig.id),
        });
      }
    }

    if (!seenBare.has(bare)) {
      seenBare.add(bare);

      for (const sig of SIGNALS) {
        if (!detected.has(sig.id) && sig.check(bare)) {
          detected.set(sig.id, {
            ...sig,
            isDevOnly: INHERENTLY_DEV.has(sig.id),
          });
        }
      }

      const dot = bare.lastIndexOf(".");
      if (dot !== -1) {
        const ext = bare.slice(dot).toLowerCase();
        for (const lang of EXT_LANGS) {
          if (!detected.has(lang.id) && lang.exts.includes(ext)) {
            detected.set(lang.id, { ...lang, isDevOnly: false });
          }
        }
      }
    }
  }

  // ── Step 3: Find dep files (prefer shallowest copy) ───────────────────
  const depFileUrls = new Map();

  for (const fullPath of allPaths) {
    const bare = fullPath.includes("/") ? fullPath.split("/").pop() : fullPath;
    if (!DEP_FILES.has(bare)) continue;

    const depth = fullPath.split("/").length;
    const existing = depFileUrls.get(bare);
    if (!existing || depth < existing.depth) {
      depFileUrls.set(bare, {
        depth,
        fullPath,
        url: `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${fullPath}`,
      });
    }
  }

  // ── Step 4: Fetch and parse dep files ─────────────────────────────────
  let sfConfig = {
    ignore: new Set(),
    pin: [],
    labels: {},
    path: null,
    card: {},
  };

  await Promise.allSettled(
    [...depFileUrls.entries()].map(async ([filename, { url }]) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const content = await res.text();

        // Handle both .stackfingerprint and .stackfingerprint.json
        if (SF_CONFIG_FILES.has(filename)) {
          // Only parse if we haven't already found a config
          // Prefer .stackfingerprint.json over .stackfingerprint if both exist
          const parsed = parseSFConfig(content);
          // Only overwrite if we got something useful or haven't set yet
          if (
            parsed.ignore.size > 0 ||
            parsed.pin.length > 0 ||
            Object.keys(parsed.labels).length > 0 ||
            parsed.path ||
            Object.keys(parsed.card).length > 0 ||
            sfConfig.ignore.size === 0
          ) {
            sfConfig = parsed;
          }
          return;
        }

        if (filename === "package.json") {
          const { prod, dev, peer } = parsePkgJsonDeps(content);
          const resolved = resolveNpmDeps(prod, dev, peer, signalsById);
          for (const [id, { isDevOnly }] of resolved) {
            if (!detected.has(id)) {
              detected.set(id, {
                ...signalsById.get(id),
                isDevOnly: isDevOnly || INHERENTLY_DEV.has(id),
              });
            } else {
              const existing = detected.get(id);
              if (existing.isDevOnly && !isDevOnly) {
                detected.set(id, { ...existing, isDevOnly: false });
              }
            }
          }
        } else if (
          filename === "requirements.txt" ||
          filename === "requirements-dev.txt" ||
          filename === "requirements-prod.txt" ||
          filename === "Pipfile"
        ) {
          const isDev = filename === "requirements-dev.txt";
          for (const dep of parsePythonDeps(content)) {
            const id = PYTHON_DEP_SIGNALS[dep];
            if (id && !detected.has(id) && signalsById.has(id)) {
              detected.set(id, {
                ...signalsById.get(id),
                isDevOnly: isDev || INHERENTLY_DEV.has(id),
              });
            }
          }
        } else if (filename === "pyproject.toml") {
          for (const dep of parsePyprojectDeps(content)) {
            const id = PYTHON_DEP_SIGNALS[dep];
            if (id && !detected.has(id) && signalsById.has(id)) {
              detected.set(id, {
                ...signalsById.get(id),
                isDevOnly: INHERENTLY_DEV.has(id),
              });
            }
          }
        } else if (filename === "Gemfile") {
          for (const dep of parseGemfileDeps(content)) {
            const id = RUBY_DEP_SIGNALS[dep];
            if (id && !detected.has(id) && signalsById.has(id)) {
              detected.set(id, {
                ...signalsById.get(id),
                isDevOnly: INHERENTLY_DEV.has(id),
              });
            }
          }
        } else if (filename === "composer.json") {
          for (const dep of parseComposerDeps(content)) {
            const id = PHP_DEP_SIGNALS[dep];
            if (id && !detected.has(id) && signalsById.has(id)) {
              detected.set(id, {
                ...signalsById.get(id),
                isDevOnly: INHERENTLY_DEV.has(id),
              });
            }
          }
        } else if (filename === "go.mod") {
          content.split("\n").forEach((line) => {
            const t = line.trim();
            if (t.includes("gin-gonic/gin") && !detected.has("gin")) {
              detected.set("gin", {
                ...signalsById.get("gin"),
                isDevOnly: false,
              });
            }
            if (t.includes("gofiber/fiber") && !detected.has("fiber")) {
              detected.set("fiber", {
                ...signalsById.get("fiber"),
                isDevOnly: false,
              });
            }
          });
        }
      } catch {
        // Dep scanning is best-effort
      }
    })
  );

  // ── Step 5: Apply .stackfingerprint config ─────────────────────────────
  // Collect ignored signals BEFORE deleting them (for showIgnored feature)
  const ignoredStack = [];
  for (const id of sfConfig.ignore) {
    if (detected.has(id)) {
      ignoredStack.push({ ...detected.get(id), isIgnored: true });
      detected.delete(id);
    }
  }

  // Apply custom labels
  for (const [id, label] of Object.entries(sfConfig.labels)) {
    if (detected.has(id)) {
      detected.set(id, { ...detected.get(id), label });
    }
  }

  // ── Step 6: Sort — pinned first, then by category order ───────────────
  const catOrder = Object.fromEntries(
    Object.entries(CATEGORY_META).map(([k, v]) => [k, v.order])
  );

  const pinnedSet = new Set(sfConfig.pin);
  const all = [...detected.values()];

  const pinned = sfConfig.pin
    .filter((id) => detected.has(id))
    .map((id) => detected.get(id));

  const rest = all
    .filter((s) => !pinnedSet.has(s.id))
    .sort(
      (a, b) => (catOrder[a.category] ?? 99) - (catOrder[b.category] ?? 99)
    );

  return {
    stack: [...pinned, ...rest],
    sfConfig,
    ignoredStack,
  };
}
