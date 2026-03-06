// src/data/cardOptions.js
// Centralises all card configuration knobs shown in the UI.

// ── Layout ─────────────────────────────────────────────────────────────────
// Controls the overall visual structure of the card
export const LAYOUTS = [
  {
    id: "classic",
    label: "Classic",
    icon: "▤",
    desc: "Header + horizontal pill rows",
    dims: { w: 600, h: 210 },
    pillRows: 3,
    maxPills: 18,
  },
  {
    id: "compact",
    label: "Compact",
    icon: "▬",
    desc: "Single row, smallest footprint",
    dims: { w: 500, h: 110 },
    pillRows: 1,
    maxPills: 7,
  },
  {
    id: "banner",
    label: "Banner",
    icon: "▭",
    desc: "Wide landscape, 2-row pills",
    dims: { w: 760, h: 180 },
    pillRows: 2,
    maxPills: 24,
  },
  {
    id: "tall",
    label: "Tall",
    icon: "▯",
    desc: "Portrait card, grouped by category",
    dims: { w: 380, h: 480 },
    pillRows: 99,
    maxPills: 40,
  },
  {
    id: "terminal",
    label: "Terminal",
    icon: ">_",
    desc: "Monospace CLI-style readout",
    dims: { w: 600, h: 280 },
    pillRows: 99,
    maxPills: 40,
  },
];

// ── Size ───────────────────────────────────────────────────────────────────
// Scales the card dimensions by a multiplier
export const SIZES = [
  { id: "sm", label: "Small", scale: 0.75 },
  { id: "md", label: "Medium", scale: 1.0 },
  { id: "lg", label: "Large", scale: 1.35 },
  { id: "xl", label: "XL", scale: 1.6 },
];

// ── Icon style ─────────────────────────────────────────────────────────────
export const ICON_STYLES = [
  { id: "color", label: "Colored", desc: "Tech brand colors" },
  { id: "mono", label: "Mono", desc: "Single accent color" },
  { id: "none", label: "No icons", desc: "Text labels only" },
];

// ── Pill shape ─────────────────────────────────────────────────────────────
export const PILL_SHAPES = [
  { id: "pill", label: "Pill", radiusFactor: 1.0 },
  { id: "round", label: "Rounded", radiusFactor: 0.45 },
  { id: "square", label: "Square", radiusFactor: 0.15 },
];

// ── Category filter ────────────────────────────────────────────────────────
// Which categories to include in the card (all = show everything detected)
export const CATEGORY_FILTERS = [
  { id: "all", label: "All detected" },
  { id: "core", label: "Core only", include: ["lang", "framework", "runtime"] },
  {
    id: "devtools",
    label: "Dev tools",
    include: ["build", "pkgmgr", "testing", "lint"],
  },
  { id: "infra", label: "Infra & CI", include: ["cicd", "infra", "db"] },
];

// ── Data fields ────────────────────────────────────────────────────────────
// Toggle which metadata fields appear on the card
export const DATA_FIELDS = [
  { id: "repoName", label: "Repo name", default: true },
  { id: "signalCount", label: "Signal count", default: true },
  { id: "footerUrl", label: "Footer URL", default: true },
  { id: "brandLabel", label: "Brand label", default: true },
  { id: "categoryDots", label: "Category dots", default: false },
  { id: "overflowBadge", label: "Overflow badge", default: true },
];

// ── Accent line ────────────────────────────────────────────────────────────
export const ACCENT_LINES = [
  { id: "bar", label: "Bar", desc: "Thin horizontal bar" },
  { id: "gradient", label: "Gradient", desc: "Faded gradient line" },
  { id: "dots", label: "Dots", desc: "Dot series" },
  { id: "none", label: "None", desc: "No accent line" },
];

// ── Background decoration ──────────────────────────────────────────────────
export const BG_DECORATIONS = [
  { id: "none", label: "Clean", desc: "Solid gradient only" },
  { id: "grid", label: "Grid", desc: "Subtle grid overlay" },
  { id: "dots", label: "Dots", desc: "Dot-matrix pattern" },
  { id: "noise", label: "Noise", desc: "Grain texture" },
  { id: "circuit", label: "Circuit", desc: "Circuit trace lines" },
];

// ── Default card config ────────────────────────────────────────────────────
export const DEFAULT_CONFIG = {
  layout: "classic",
  size: "md",
  theme: "midnight",
  iconStyle: "color",
  pillShape: "pill",
  categoryFilter: "all",
  accentLine: "bar",
  bgDecoration: "none",
  dataFields: {
    repoName: true,
    signalCount: true,
    footerUrl: true,
    brandLabel: true,
    categoryDots: false,
    overflowBadge: true,
  },
};
