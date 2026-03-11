// src/lib/svgBuilder.js
import { THEMES } from "../data/themes";
import { LAYOUTS, SIZES, CATEGORY_FILTERS } from "../data/cardOptions";
import { CATEGORY_META } from "../data/signals";

// ── Icon URL / data-URI resolver ───────────────────────────────────────────
function resolveIcon(slug, rawHex, iconBase64Map) {
  const hex = rawHex.replace("#", "").toLowerCase();
  if (iconBase64Map) {
    const val = iconBase64Map[`${slug}/${hex}`];
    if (val === null) return null;
    if (val) return val;
  }
  return `https://cdn.simpleicons.org/${slug}/${hex}`;
}

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// ── Safe scale extractor ───────────────────────────────────────────────────
function getSafeScale(sizeObj) {
  if (!sizeObj) return 1;
  const raw =
    sizeObj.scale ?? sizeObj.multiplier ?? sizeObj.value ?? sizeObj.factor ?? 1;
  return typeof raw === "number" && isFinite(raw) && raw > 0 ? raw : 1;
}

// ── Pill layout helper ─────────────────────────────────────────────────────
// When iconStyle is "icononly" every pill is a square of size pillH,
// so pw is always pillH regardless of label length.
function layoutPills(
  pills,
  maxW,
  pillH,
  fontSize,
  iconW,
  gap,
  maxRows,
  iconStyle
) {
  const isIconOnly = iconStyle === "icononly";
  const rows = [];
  let row = [],
    rowW = 0;

  for (const p of pills) {
    const pw = isIconOnly
      ? pillH
      : Math.max(58, p.label.length * fontSize * 0.63 + iconW + 24);
    if (rowW + pw + gap > maxW - 44 && row.length > 0) {
      rows.push(row);
      if (rows.length >= maxRows) break;
      row = [{ ...p, pw }];
      rowW = pw + gap;
    } else {
      row.push({ ...p, pw });
      rowW += pw + gap;
    }
  }
  if (row.length > 0 && rows.length < maxRows) rows.push(row);
  return rows;
}

// ── Shared pill SVG ────────────────────────────────────────────────────────
// iconStyle "icononly": square tile = pillH × pillH, centred icon, no text.
// Falls back to 2-char initials when no icon is available.
function renderPill(
  p,
  x,
  y,
  pillH,
  pillR,
  fontSize,
  iconW,
  iconStyle,
  accentColor,
  iconBase64Map
) {
  // ── icononly: square tile, no label ───────────────────────────────────
  if (iconStyle === "icononly") {
    const size = pillH; // square
    const px = x.toFixed(1);
    const rad = pillR.toFixed(1);
    const fillColor = p.color;
    const textC = p.textColor ?? "#ffffff";
    const iconHex = textC.replace("#", "").toLowerCase();
    const icSize = Math.round(size * 0.55);
    const icOff = (size - icSize) / 2;

    let inner = "";
    if (p.iconSlug) {
      const href = resolveIcon(p.iconSlug, iconHex, iconBase64Map);
      if (href) {
        inner = `<image href="${href}" x="${(+px + icOff).toFixed(1)}" y="${(y + icOff).toFixed(1)}" width="${icSize}" height="${icSize}"/>`;
      }
    }
    if (!inner) {
      // Fallback: 2-char initials centred in the square
      inner = `<text x="${(+px + size / 2).toFixed(1)}" y="${(y + size / 2 + fontSize * 0.38).toFixed(1)}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="${Math.round(fontSize * 0.9)}" font-weight="700" fill="${textC}">${esc(p.label.slice(0, 2))}</text>`;
    }

    return `<rect x="${px}" y="${y}" width="${size}" height="${size}" rx="${rad}" fill="${fillColor}" opacity="0.92"/>
      ${inner}`;
  }

  // ── Standard pill (color / mono / none) ───────────────────────────────
  const px = x.toFixed(1);
  const rad = pillR.toFixed(1);
  const fillColor = iconStyle === "mono" ? accentColor : p.color;
  const textC = iconStyle === "mono" ? "#ffffff" : (p.textColor ?? "#ffffff");
  const iconHex = textC.replace("#", "").toLowerCase();

  let iconSVG = "";
  if (iconStyle !== "none" && p.iconSlug) {
    const href = resolveIcon(p.iconSlug, iconHex, iconBase64Map);
    if (href) {
      iconSVG = `<image href="${href}" x="${(+px + 6).toFixed(1)}" y="${(y + (pillH - iconW) / 2).toFixed(1)}" width="${iconW}" height="${iconW}"/>`;
    }
  }

  const hasIcon = iconSVG !== "";
  const textX = hasIcon
    ? (+px + iconW + 12).toFixed(1)
    : (+px + p.pw / 2).toFixed(1);
  const textAnchor = hasIcon ? "start" : "middle";

  return `<rect x="${px}" y="${y}" width="${p.pw.toFixed(1)}" height="${pillH}" rx="${rad}" fill="${fillColor}" opacity="0.92"/>
      ${iconSVG}
      <text x="${textX}" y="${(y + pillH / 2 + fontSize * 0.38).toFixed(1)}" text-anchor="${textAnchor}" font-family="'Geist Mono','JetBrains Mono',ui-monospace,monospace" font-size="${fontSize}" font-weight="600" fill="${textC}">${esc(p.label)}</text>`;
}

// ── Background decorations ─────────────────────────────────────────────────
function bgDecorationParts(type, W, H, accentColor) {
  if (type === "grid") {
    return {
      defs: `<pattern id="bgPattern" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="${accentColor}" stroke-opacity="0.06" stroke-width="0.5"/></pattern>`,
      body: `<rect width="${W}" height="${H}" fill="url(#bgPattern)"/>`,
    };
  }
  if (type === "dots") {
    return {
      defs: `<pattern id="bgPattern" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="${accentColor}" fill-opacity="0.12"/></pattern>`,
      body: `<rect width="${W}" height="${H}" fill="url(#bgPattern)"/>`,
    };
  }
  if (type === "circuit") {
    const lines = [];
    for (let i = 0; i < 6; i++) {
      const x1 = 30 + i * 90,
        y1 = 20,
        y2 = H - 20;
      lines.push(
        `<line x1="${x1}" y1="${y1}" x2="${x1}" y2="${y2}" stroke="${accentColor}" stroke-opacity="0.05" stroke-width="1"/>`
      );
      lines.push(
        `<circle cx="${x1}" cy="${y1 + 10 + i * 15}" r="2" fill="${accentColor}" fill-opacity="0.08"/>`
      );
    }
    return { defs: "", body: lines.join("\n") };
  }
  if (type === "noise") {
    return {
      defs: `<filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feBlend in="SourceGraphic" mode="overlay" result="blend"/><feComposite in="blend" in2="SourceGraphic" operator="in"/></filter>`,
      body: `<rect width="${W}" height="${H}" fill="${accentColor}" opacity="0.03" filter="url(#noiseFilter)"/>`,
    };
  }
  return { defs: "", body: "" };
}

// ── Accent line ────────────────────────────────────────────────────────────
function accentLineParts(type, x, y, w, color) {
  if (type === "bar") {
    return {
      defs: "",
      body: `<rect x="${x}" y="${y}" width="${w}" height="2" rx="1" fill="${color}" opacity="0.7"/>`,
    };
  }
  if (type === "gradient") {
    return {
      defs: `<linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${color}" stop-opacity="0.8"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient>`,
      body: `<rect x="${x}" y="${y}" width="${w * 2}" height="2" rx="1" fill="url(#accentGrad)"/>`,
    };
  }
  if (type === "dots") {
    let d = "";
    for (let i = 0; i < 6; i++)
      d += `<circle cx="${x + i * 8}" cy="${y + 1}" r="1.5" fill="${color}" opacity="${(0.8 - i * 0.12).toFixed(2)}"/>`;
    return { defs: "", body: d };
  }
  return { defs: "", body: "" };
}

// ── Shared category order ──────────────────────────────────────────────────
const CAT_ORDER = {
  lang: 0,
  framework: 1,
  runtime: 2,
  build: 3,
  pkgmgr: 4,
  db: 5,
  testing: 6,
  cicd: 7,
  infra: 8,
  lint: 9,
};

function groupByCategory(stack) {
  const groups = {};
  stack.forEach((t) => {
    if (!groups[t.category]) groups[t.category] = [];
    groups[t.category].push(t);
  });
  return Object.entries(groups).sort(
    ([a], [b]) => (CAT_ORDER[a] ?? 99) - (CAT_ORDER[b] ?? 99)
  );
}

// ── Overflow badge helper ──────────────────────────────────────────────────
function overflowBadge(overflow, x, y, PH, PR, theme) {
  if (overflow <= 0) return "";
  return `<rect x="${x}" y="${y}" width="30" height="${PH}" rx="${PR}" fill="rgba(255,255,255,0.06)" stroke="${theme.border}" stroke-width="1"/>
    <text x="${x + 15}" y="${y + PH / 2 + 4}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="9" fill="rgba(255,255,255,0.35)">+${overflow}</text>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Layout: CLASSIC ───────────────────────────────────────────────────────────
// Header + up to 3 centred pill rows. The general-purpose default.
// ══════════════════════════════════════════════════════════════════════════════
function buildClassic(owner, repo, stack, theme, cfg, iconBase64Map) {
  const W = 600;
  const sizeObj = SIZES.find((s) => s.id === cfg.size) ?? SIZES[1];
  const scale = getSafeScale(sizeObj);
  const PH = 28,
    PR = cfg.pillShape === "square" ? 4 : cfg.pillShape === "round" ? 8 : 14;
  const FS = 11,
    IW = 14,
    GAP = 8;
  const HEADER_H = 76; // space above first pill row
  const FOOTER_H = 28; // space below last pill row
  const PAD_V = 8; // vertical pad between rows

  // No cap — pack all pills into as many rows as needed
  const rows = layoutPills(stack, W, PH, FS, IW, GAP, Infinity, cfg.iconStyle);

  let pillsSVG = "";
  rows.forEach((row, ri) => {
    const totalW = row.reduce((a, p) => a + p.pw + GAP, -GAP);
    let x = (W - totalW) / 2;
    const y = HEADER_H + ri * (PH + PAD_V);
    row.forEach((p) => {
      pillsSVG += renderPill(
        p,
        x,
        y,
        PH,
        PR,
        FS,
        IW,
        cfg.iconStyle,
        theme.accent,
        iconBase64Map
      );
      x += p.pw + GAP;
    });
  });

  if (!stack.length)
    pillsSVG = `<text x="${W / 2}" y="130" text-anchor="middle" font-family="ui-monospace,monospace" font-size="12" fill="${theme.muted}">minimal stack detected</text>`;

  // Height shrinks/grows to exactly fit content
  const gridH = rows.length > 0 ? rows.length * (PH + PAD_V) - PAD_V : PH;
  const H = HEADER_H + gridH + FOOTER_H;

  return buildWrapper(
    W,
    H,
    scale,
    theme,
    cfg,
    owner,
    repo,
    stack.length,
    `
    ${
      cfg.dataFields.repoName
        ? `<text x="22" y="50" font-family="'Geist Mono','JetBrains Mono',ui-monospace,monospace" font-size="20" font-weight="700" letter-spacing="-0.3">
      <tspan fill="${theme.owner}">${esc(owner)}</tspan><tspan fill="${theme.slash}">/</tspan><tspan fill="${theme.title}">${esc(repo)}</tspan>
    </text>`
        : ""
    }
    ${cfg.dataFields.signalCount ? `<text x="22" y="68" font-family="ui-monospace,monospace" font-size="9" fill="${theme.sub}" letter-spacing="1.8">STACK FINGERPRINT · ${stack.length} SIGNAL${stack.length !== 1 ? "S" : ""} DETECTED</text>` : ""}
    ${pillsSVG}
    ${cfg.dataFields.footerUrl ? `<text x="22" y="${H - 12}" font-family="ui-monospace,monospace" font-size="8" fill="${theme.muted}" letter-spacing="0.8">github.com/${esc(owner)}/${esc(repo)}</text>` : ""}
    ${cfg.dataFields.brandLabel ? `<text x="${W - 22}" y="${H - 12}" text-anchor="end" font-family="ui-monospace,monospace" font-size="8" fill="${theme.muted}" letter-spacing="0.8">stackfingerprint.vercel.app</text>` : ""}
  `
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Layout: COMPACT ───────────────────────────────────────────────────────────
// Single pill row, minimal height. Best for inline embeds.
// ══════════════════════════════════════════════════════════════════════════════
function buildCompact(owner, repo, stack, theme, cfg, iconBase64Map) {
  const W = 500;
  const sizeObj = SIZES.find((s) => s.id === cfg.size) ?? SIZES[1];
  const scale = getSafeScale(sizeObj);
  const PH = 22,
    PR = cfg.pillShape === "square" ? 3 : cfg.pillShape === "round" ? 6 : 11;
  const FS = 9,
    IW = 11,
    GAP = 6;
  const HEADER_H = 50,
    FOOTER_H = 18,
    ROW_PAD = 8;

  // Pack all pills — compact stays single-row by design but if icononly is
  // active the squares fit many more, so allow multiple rows.
  const rows = layoutPills(stack, W, PH, FS, IW, GAP, Infinity, cfg.iconStyle);

  let pillsSVG = "";
  rows.forEach((row, ri) => {
    const totalW = row.reduce((a, p) => a + p.pw + GAP, -GAP);
    let x = (W - totalW) / 2;
    const y = HEADER_H + ri * (PH + ROW_PAD);
    row.forEach((p) => {
      pillsSVG += renderPill(
        p,
        x,
        y,
        PH,
        PR,
        FS,
        IW,
        cfg.iconStyle,
        theme.accent,
        iconBase64Map
      );
      x += p.pw + GAP;
    });
  });

  const gridH = rows.length > 0 ? rows.length * (PH + ROW_PAD) - ROW_PAD : PH;
  const H = HEADER_H + gridH + FOOTER_H;

  return buildWrapper(
    W,
    H,
    scale,
    theme,
    cfg,
    owner,
    repo,
    stack.length,
    `
    ${
      cfg.dataFields.repoName
        ? `<text x="20" y="30" font-family="'Geist Mono','JetBrains Mono',ui-monospace,monospace" font-size="14" font-weight="700" letter-spacing="-0.2">
      <tspan fill="${theme.owner}">${esc(owner)}</tspan><tspan fill="${theme.slash}">/</tspan><tspan fill="${theme.title}">${esc(repo)}</tspan>
    </text>`
        : ""
    }
    ${cfg.dataFields.signalCount ? `<text x="20" y="44" font-family="ui-monospace,monospace" font-size="8" fill="${theme.sub}" letter-spacing="1.5">${stack.length} SIGNALS</text>` : ""}
    ${pillsSVG}
    ${cfg.dataFields.footerUrl ? `<text x="${W / 2}" y="${H - 6}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="7" fill="${theme.muted}">github.com/${esc(owner)}/${esc(repo)}</text>` : ""}
  `
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Layout: BANNER ────────────────────────────────────────────────────────────
// Wide landscape, 2-row pills. Good for project pages and social previews.
// ══════════════════════════════════════════════════════════════════════════════
function buildBanner(owner, repo, stack, theme, cfg, iconBase64Map) {
  const W = 760;
  const sizeObj = SIZES.find((s) => s.id === cfg.size) ?? SIZES[1];
  const scale = getSafeScale(sizeObj);
  const PH = 26,
    PR = cfg.pillShape === "square" ? 4 : cfg.pillShape === "round" ? 8 : 13;
  const FS = 10,
    IW = 13,
    GAP = 7;
  const HEADER_H = 68,
    FOOTER_H = 24,
    ROW_PAD = 8;

  const rows = layoutPills(stack, W, PH, FS, IW, GAP, Infinity, cfg.iconStyle);

  let pillsSVG = "";
  rows.forEach((row, ri) => {
    const totalW = row.reduce((a, p) => a + p.pw + GAP, -GAP);
    let x = (W - totalW) / 2;
    const y = HEADER_H + ri * (PH + ROW_PAD);
    row.forEach((p) => {
      pillsSVG += renderPill(
        p,
        x,
        y,
        PH,
        PR,
        FS,
        IW,
        cfg.iconStyle,
        theme.accent,
        iconBase64Map
      );
      x += p.pw + GAP;
    });
  });

  const gridH = rows.length > 0 ? rows.length * (PH + ROW_PAD) - ROW_PAD : PH;
  const H = HEADER_H + gridH + FOOTER_H;

  return buildWrapper(
    W,
    H,
    scale,
    theme,
    cfg,
    owner,
    repo,
    stack.length,
    `
    ${
      cfg.dataFields.repoName
        ? `<text x="24" y="40" font-family="'Geist Mono','JetBrains Mono',ui-monospace,monospace" font-size="18" font-weight="700" letter-spacing="-0.3">
      <tspan fill="${theme.owner}">${esc(owner)}</tspan><tspan fill="${theme.slash}">/</tspan><tspan fill="${theme.title}">${esc(repo)}</tspan>
    </text>`
        : ""
    }
    ${cfg.dataFields.signalCount ? `<text x="24" y="56" font-family="ui-monospace,monospace" font-size="9" fill="${theme.sub}" letter-spacing="1.5">STACK FINGERPRINT · ${stack.length} SIGNALS</text>` : ""}
    ${pillsSVG}
    ${cfg.dataFields.footerUrl ? `<text x="24" y="${H - 8}" font-family="ui-monospace,monospace" font-size="8" fill="${theme.muted}">github.com/${esc(owner)}/${esc(repo)}</text>` : ""}
    ${cfg.dataFields.brandLabel ? `<text x="${W - 24}" y="${H - 8}" text-anchor="end" font-family="ui-monospace,monospace" font-size="8" fill="${theme.muted}">stackfingerprint.vercel.app</text>` : ""}
  `
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Layout: TALL ──────────────────────────────────────────────────────────────
// Portrait card, pills grouped by category with section labels.
// ══════════════════════════════════════════════════════════════════════════════
function buildTall(owner, repo, stack, theme, cfg, iconBase64Map) {
  const W = 380,
    H = 480;
  const sizeObj = SIZES.find((s) => s.id === cfg.size) ?? SIZES[1];
  const scale = getSafeScale(sizeObj);
  const PH = 24,
    PR = cfg.pillShape === "square" ? 3 : cfg.pillShape === "round" ? 6 : 12;
  const FS = 10,
    IW = 12,
    GAP = 7;

  const groups = groupByCategory(stack);
  let pillsSVG = "",
    curY = 76;

  groups.forEach(([cat, items]) => {
    const catLabel = CATEGORY_META[cat]?.label ?? cat;
    pillsSVG += `<text x="18" y="${curY}" font-family="ui-monospace,monospace" font-size="8" fill="${theme.sub}" letter-spacing="2">${catLabel.toUpperCase()}</text>`;
    curY += 14;
    let x = 18;
    items.forEach((p, i) => {
      const pw =
        cfg.iconStyle === "icononly"
          ? PH
          : Math.max(60, p.label.length * FS * 0.63 + IW + 24);
      if (x + pw > W - 18 && i > 0) {
        curY += PH + GAP;
        x = 18;
      }
      pillsSVG += renderPill(
        { ...p, pw },
        x,
        curY,
        PH,
        PR,
        FS,
        IW,
        cfg.iconStyle,
        theme.accent,
        iconBase64Map
      );
      x += pw + GAP;
    });
    curY += PH + 16;
  });

  const actualH = Math.max(H, curY + 28);

  return buildWrapper(
    W,
    actualH,
    scale,
    theme,
    cfg,
    owner,
    repo,
    stack.length,
    `
    ${
      cfg.dataFields.repoName
        ? `<text x="18" y="38" font-family="'Geist Mono','JetBrains Mono',ui-monospace,monospace" font-size="15" font-weight="700" letter-spacing="-0.2">
      <tspan fill="${theme.owner}">${esc(owner)}</tspan><tspan fill="${theme.slash}">/</tspan><tspan fill="${theme.title}">${esc(repo)}</tspan>
    </text>`
        : ""
    }
    ${cfg.dataFields.signalCount ? `<text x="18" y="54" font-family="ui-monospace,monospace" font-size="8.5" fill="${theme.sub}" letter-spacing="1.5">${stack.length} SIGNALS DETECTED</text>` : ""}
    ${pillsSVG}
    ${cfg.dataFields.footerUrl ? `<text x="18" y="${actualH - 12}" font-family="ui-monospace,monospace" font-size="7.5" fill="${theme.muted}">github.com/${esc(owner)}/${esc(repo)}</text>` : ""}
  `
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Layout: TERMINAL ──────────────────────────────────────────────────────────
// Monospace CLI-style readout, text-only, no pill icons.
// ══════════════════════════════════════════════════════════════════════════════
function buildTerminal(owner, repo, stack, theme, cfg) {
  const W = 600;
  const sizeObj = SIZES.find((s) => s.id === cfg.size) ?? SIZES[1];
  const scale = getSafeScale(sizeObj);

  const groups = groupByCategory(stack);
  const lines = [];
  lines.push({
    prompt: "$",
    cmd: `stack-fingerprint scan ${owner}/${repo}`,
    color: theme.title,
  });
  lines.push({ prompt: "", cmd: "", color: "transparent" });

  // No group cap — show all categories
  groups.forEach(([cat, items]) => {
    const label = (CATEGORY_META[cat]?.label ?? cat).padEnd(12);
    lines.push({ label, vals: items.map((i) => i.label).join(", ") });
  });

  lines.push({ prompt: "", cmd: "", color: "transparent" });
  lines.push({
    prompt: "✓",
    cmd: `${stack.length} signals detected`,
    color: theme.accent,
  });

  const lineH = 18,
    startY = 54;
  const FOOTER_H = 28;
  const H = startY + lines.length * lineH + FOOTER_H;

  let linesVG = "";
  lines.forEach((ln, i) => {
    const y = startY + i * lineH;
    if (ln.prompt !== undefined) {
      linesVG += `<text x="22" y="${y}" font-family="'Geist Mono','JetBrains Mono',ui-monospace,monospace" font-size="11" fill="${ln.color}">
        <tspan fill="${theme.accent}">${esc(ln.prompt)} </tspan><tspan fill="${theme.title}">${esc(ln.cmd)}</tspan>
      </text>`;
    } else if (ln.label) {
      linesVG += `<text x="22" y="${y}" font-family="'Geist Mono','JetBrains Mono',ui-monospace,monospace" font-size="11">
        <tspan fill="${theme.sub}">${esc(ln.label)}</tspan><tspan fill="${theme.title}" dx="4">${esc(ln.vals)}</tspan>
      </text>`;
    }
  });
  linesVG += `<rect x="22" y="${startY + lines.length * lineH - 14}" width="7" height="12" fill="${theme.accent}" opacity="0.7"/>`;

  return buildWrapper(
    W,
    H,
    scale,
    theme,
    cfg,
    owner,
    repo,
    stack.length,
    `
    <rect x="0" y="0" width="${W}" height="30" fill="${theme.accent}" opacity="0.08"/>
    <circle cx="18" cy="15" r="5" fill="#ff5f57" opacity="0.8"/>
    <circle cx="34" cy="15" r="5" fill="#ffbd2e" opacity="0.8"/>
    <circle cx="50" cy="15" r="5" fill="#28c840" opacity="0.8"/>
    <text x="${W / 2}" y="19" text-anchor="middle" font-family="ui-monospace,monospace" font-size="9" fill="${theme.sub}" letter-spacing="1">TERMINAL</text>
    <line x1="0" y1="30" x2="${W}" y2="30" stroke="${theme.border}" stroke-width="1"/>
    ${linesVG}
    ${cfg.dataFields.footerUrl ? `<text x="22" y="${H - 10}" font-family="ui-monospace,monospace" font-size="7.5" fill="${theme.muted}">github.com/${esc(owner)}/${esc(repo)}</text>` : ""}
    ${cfg.dataFields.brandLabel ? `<text x="${W - 22}" y="${H - 10}" text-anchor="end" font-family="ui-monospace,monospace" font-size="7.5" fill="${theme.muted}">stackfingerprint.vercel.app</text>` : ""}
  `
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Layout: MINIMAL ───────────────────────────────────────────────────────────
// No header chrome — just pills on a clean background. Perfect for README
// embeds where you don't want the repo name repeated.
// ══════════════════════════════════════════════════════════════════════════════
function buildMinimal(owner, repo, stack, theme, cfg, iconBase64Map) {
  const W = 560;
  const sizeObj = SIZES.find((s) => s.id === cfg.size) ?? SIZES[1];
  const scale = getSafeScale(sizeObj);
  const PH = 24,
    PR = cfg.pillShape === "square" ? 3 : cfg.pillShape === "round" ? 6 : 12;
  const FS = 9,
    IW = 11,
    GAP = 6;
  const PAD_V = 16,
    ROW_GAP = 6;

  // No cap — lay out every tech, as many rows as needed
  const rows = layoutPills(stack, W, PH, FS, IW, GAP, Infinity, cfg.iconStyle);

  let pillsSVG = "";
  rows.forEach((row, ri) => {
    const totalW = row.reduce((a, p) => a + p.pw + GAP, -GAP);
    let x = (W - totalW) / 2;
    const y = PAD_V + ri * (PH + ROW_GAP);
    row.forEach((p) => {
      pillsSVG += renderPill(
        p,
        x,
        y,
        PH,
        PR,
        FS,
        IW,
        cfg.iconStyle,
        theme.accent,
        iconBase64Map
      );
      x += p.pw + GAP;
    });
  });

  const gridH = rows.length > 0 ? rows.length * (PH + ROW_GAP) - ROW_GAP : PH;
  const H = PAD_V + gridH + PAD_V;

  return buildWrapper(
    W,
    H,
    scale,
    theme,
    cfg,
    owner,
    repo,
    stack.length,
    pillsSVG
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Layout: ICONS ─────────────────────────────────────────────────────────────
// Icon-only grid — no text labels, maximum density. Great for a visual glance
// at a large stack without taking up much vertical space.
// ══════════════════════════════════════════════════════════════════════════════
function buildIcons(owner, repo, stack, theme, cfg, iconBase64Map) {
  const COLS = 12;
  const CELL = 36,
    PAD = 16,
    GAP = 8;
  const ICW = 20; // icon size inside each cell

  // No cap — show all techs, grid grows as needed
  const visible = stack;
  const overflow = 0; // nothing hidden
  const rows = Math.ceil(visible.length / COLS);

  const W = COLS * (CELL + GAP) - GAP + PAD * 2;
  const headerH = cfg.dataFields.repoName ? 42 : 0;
  const gridH = rows * (CELL + GAP) - GAP;
  const footerH = cfg.dataFields.footerUrl ? 20 : 0;
  const H = headerH + gridH + PAD * 2 + footerH;

  const sizeObj = SIZES.find((s) => s.id === cfg.size) ?? SIZES[1];
  const scale = getSafeScale(sizeObj);
  const PR =
    cfg.pillShape === "square" ? 4 : cfg.pillShape === "round" ? 8 : CELL / 2;

  let cellsSVG = "";
  visible.forEach((tech, idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const cx = PAD + col * (CELL + GAP);
    const cy = headerH + PAD + row * (CELL + GAP);

    const fillColor = cfg.iconStyle === "mono" ? theme.accent : tech.color;
    const textC =
      cfg.iconStyle === "mono" ? "#ffffff" : (tech.textColor ?? "#ffffff");
    const iconHex = textC.replace("#", "").toLowerCase();

    cellsSVG += `<rect x="${cx}" y="${cy}" width="${CELL}" height="${CELL}" rx="${PR}" fill="${fillColor}" opacity="0.9"/>`;

    if (cfg.iconStyle !== "none" && tech.iconSlug) {
      const href = resolveIcon(tech.iconSlug, iconHex, iconBase64Map);
      if (href) {
        const iOff = (CELL - ICW) / 2;
        cellsSVG += `<image href="${href}" x="${cx + iOff}" y="${cy + iOff}" width="${ICW}" height="${ICW}"/>`;
      } else {
        // Fallback: first 2 chars of label
        const initials = tech.label.slice(0, 2);
        cellsSVG += `<text x="${cx + CELL / 2}" y="${cy + CELL / 2 + 4}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="9" font-weight="700" fill="${textC}">${esc(initials)}</text>`;
      }
    } else {
      const initials = tech.label.slice(0, 2);
      cellsSVG += `<text x="${cx + CELL / 2}" y="${cy + CELL / 2 + 4}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="9" font-weight="700" fill="${textC}">${esc(initials)}</text>`;
    }
  });

  // Overflow cell
  if (overflow > 0 && cfg.dataFields.overflowBadge) {
    const col = visible.length % COLS;
    const row = Math.floor(visible.length / COLS);
    const cx = PAD + col * (CELL + GAP);
    const cy = headerH + PAD + row * (CELL + GAP);
    cellsSVG += `<rect x="${cx}" y="${cy}" width="${CELL}" height="${CELL}" rx="${PR}" fill="rgba(255,255,255,0.06)" stroke="${theme.border}" stroke-width="1"/>`;
    cellsSVG += `<text x="${cx + CELL / 2}" y="${cy + CELL / 2 + 4}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="9" fill="rgba(255,255,255,0.4)">+${overflow}</text>`;
  }

  return buildWrapper(
    W,
    H,
    scale,
    theme,
    cfg,
    owner,
    repo,
    stack.length,
    `
    ${
      cfg.dataFields.repoName
        ? `<text x="${PAD}" y="26" font-family="'Geist Mono','JetBrains Mono',ui-monospace,monospace" font-size="13" font-weight="700" letter-spacing="-0.2">
      <tspan fill="${theme.owner}">${esc(owner)}</tspan><tspan fill="${theme.slash}">/</tspan><tspan fill="${theme.title}">${esc(repo)}</tspan>
    </text>`
        : ""
    }
    ${cellsSVG}
    ${cfg.dataFields.footerUrl ? `<text x="${PAD}" y="${H - 6}" font-family="ui-monospace,monospace" font-size="7" fill="${theme.muted}">github.com/${esc(owner)}/${esc(repo)}</text>` : ""}
  `
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Layout: SIDEBAR ───────────────────────────────────────────────────────────
// Narrow vertical strip (160px wide). Designed to sit in a README sidebar,
// wiki panel, or documentation page margin. One pill per row, full width.
// ══════════════════════════════════════════════════════════════════════════════
function buildSidebar(owner, repo, stack, theme, cfg, iconBase64Map) {
  const isIconOnly = cfg.iconStyle === "icononly";
  const W = 160;
  const PH = 26,
    PR = cfg.pillShape === "square" ? 3 : cfg.pillShape === "round" ? 6 : 13;
  const FS = 9,
    IW = 12,
    GAP = 5,
    PAD = 12;

  // No cap — show all techs; sidebar grows vertically
  const visible = stack;
  const overflow = 0;
  const headerH = cfg.dataFields.repoName ? 52 : PAD;
  const sizeObj = SIZES.find((s) => s.id === cfg.size) ?? SIZES[1];
  const scale = getSafeScale(sizeObj);

  let pillsSVG = "";
  let H;

  if (isIconOnly) {
    // Grid of squares: 3 columns inside 160px sidebar
    const COLS = 3;
    const CELL = PH,
      HGAP = GAP,
      VGAP = GAP;
    const rowCount = Math.ceil(visible.length / COLS);
    const gridH = rowCount * (CELL + VGAP) - VGAP;
    const overflowH =
      overflow > 0 && cfg.dataFields.overflowBadge ? CELL + VGAP : 0;
    const footerH = cfg.dataFields.footerUrl ? 18 : 0;
    H = headerH + PAD + gridH + overflowH + PAD + footerH;

    visible.forEach((p, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = PAD + col * (CELL + HGAP);
      const y = headerH + PAD + row * (CELL + VGAP);
      pillsSVG += renderPill(
        { ...p, pw: CELL },
        x,
        y,
        CELL,
        PR,
        FS,
        IW,
        cfg.iconStyle,
        theme.accent,
        iconBase64Map
      );
    });

    if (overflow > 0 && cfg.dataFields.overflowBadge) {
      const col = visible.length % COLS;
      const row = Math.floor(visible.length / COLS);
      const x = PAD + col * (CELL + HGAP);
      const y = headerH + PAD + row * (CELL + VGAP);
      pillsSVG += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="${PR}" fill="rgba(255,255,255,0.06)" stroke="${theme.border}" stroke-width="1"/>`;
      pillsSVG += `<text x="${x + CELL / 2}" y="${y + CELL / 2 + 3.5}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="7" fill="rgba(255,255,255,0.35)">+${overflow}</text>`;
    }
  } else {
    // Original: one full-width pill per row
    const itemsH = visible.length * (PH + GAP) - GAP;
    const overflowH =
      overflow > 0 && cfg.dataFields.overflowBadge ? PH + GAP : 0;
    const footerH = cfg.dataFields.footerUrl ? 18 : 0;
    H = headerH + itemsH + overflowH + PAD + footerH;

    visible.forEach((p, i) => {
      const pw = W - PAD * 2;
      const y = headerH + i * (PH + GAP);
      pillsSVG += renderPill(
        { ...p, pw },
        PAD,
        y,
        PH,
        PR,
        FS,
        IW,
        cfg.iconStyle,
        theme.accent,
        iconBase64Map
      );
    });

    if (overflow > 0 && cfg.dataFields.overflowBadge) {
      const y = headerH + visible.length * (PH + GAP);
      const pw = W - PAD * 2;
      pillsSVG += `<rect x="${PAD}" y="${y}" width="${pw}" height="${PH}" rx="${PR}" fill="rgba(255,255,255,0.06)" stroke="${theme.border}" stroke-width="1"/>`;
      pillsSVG += `<text x="${W / 2}" y="${y + PH / 2 + 3.5}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="8" fill="rgba(255,255,255,0.35)">+${overflow} more</text>`;
    }
  }

  return buildWrapper(
    W,
    H,
    scale,
    theme,
    cfg,
    owner,
    repo,
    stack.length,
    `
    ${
      cfg.dataFields.repoName
        ? `
    <text x="${PAD}" y="22" font-family="'Geist Mono','JetBrains Mono',ui-monospace,monospace" font-size="11" font-weight="700" fill="${theme.owner}">${esc(owner)}</text>
    <text x="${PAD}" y="36" font-family="'Geist Mono','JetBrains Mono',ui-monospace,monospace" font-size="11" font-weight="700" fill="${theme.title}">${esc(repo)}</text>
    <line x1="${PAD}" y1="44" x2="${W - PAD}" y2="44" stroke="${theme.border}" stroke-width="1"/>`
        : ""
    }
    ${cfg.dataFields.signalCount ? `<text x="${PAD}" y="${headerH - 6}" font-family="ui-monospace,monospace" font-size="7" fill="${theme.sub}" letter-spacing="1">${stack.length} SIGNALS</text>` : ""}
    ${pillsSVG}
    ${cfg.dataFields.footerUrl ? `<text x="${W / 2}" y="${H - 5}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="6" fill="${theme.muted}">stackfingerprint.vercel.app</text>` : ""}
  `
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Layout: SPLIT ─────────────────────────────────────────────────────────────
// Two-column card: left panel shows repo name + category breakdown as a
// text list; right panel shows icon pills. Ideal for portfolio pages or
// project showcases where prose context matters alongside the tech grid.
// ══════════════════════════════════════════════════════════════════════════════
function buildSplit(owner, repo, stack, theme, cfg, iconBase64Map) {
  const W = 680;
  const DIVX = 220; // x position of the divider line
  const sizeObj = SIZES.find((s) => s.id === cfg.size) ?? SIZES[1];
  const scale = getSafeScale(sizeObj);
  const PH = 24,
    PR = cfg.pillShape === "square" ? 3 : cfg.pillShape === "round" ? 6 : 12;
  const FS = 9,
    IW = 11,
    GAP = 6;
  const TOP_PAD = 20,
    FOOTER_H = 24;

  // ── Right panel rows first — H is driven by whichever panel is taller ──
  const rightW = W - DIVX;
  const rows = layoutPills(
    stack,
    rightW,
    PH,
    FS,
    IW,
    GAP,
    Infinity,
    cfg.iconStyle
  );
  const rightGridH = rows.length > 0 ? rows.length * (PH + GAP) - GAP : PH;
  const rightContentH = TOP_PAD + rightGridH + FOOTER_H;

  // ── Left panel: repo info + all category rows ───────────────────────────
  const groups = groupByCategory(stack);
  const catListH = groups.length * 16;
  const leftContentH = 98 + catListH + FOOTER_H;

  // Card height = tallest panel
  const H = Math.max(rightContentH, leftContentH, 120);

  let leftSVG = "";
  if (cfg.dataFields.repoName) {
    leftSVG += `<text x="20" y="46" font-family="'Geist Mono','JetBrains Mono',ui-monospace,monospace" font-size="16" font-weight="700" letter-spacing="-0.2">
      <tspan fill="${theme.owner}">${esc(owner)}</tspan>
    </text>`;
    leftSVG += `<text x="20" y="64" font-family="'Geist Mono','JetBrains Mono',ui-monospace,monospace" font-size="16" font-weight="700" letter-spacing="-0.2" fill="${theme.title}">${esc(repo)}</text>`;
  }
  if (cfg.dataFields.signalCount) {
    leftSVG += `<text x="20" y="80" font-family="ui-monospace,monospace" font-size="8" fill="${theme.sub}" letter-spacing="1.5">${stack.length} SIGNALS DETECTED</text>`;
  }

  // All category rows — no slice cap
  let catY = 98;
  groups.forEach(([cat, items]) => {
    const label = CATEGORY_META[cat]?.label ?? cat;
    const count = items.length;
    leftSVG += `<circle cx="24" cy="${catY - 3}" r="3" fill="${theme.accent}" opacity="0.7"/>`;
    leftSVG += `<text x="34" y="${catY}" font-family="ui-monospace,monospace" font-size="9" fill="${theme.sub}">${esc(label)}</text>`;
    leftSVG += `<text x="${DIVX - 18}" y="${catY}" text-anchor="end" font-family="ui-monospace,monospace" font-size="9" fill="${theme.title}">${count}</text>`;
    catY += 16;
  });

  if (cfg.dataFields.footerUrl) {
    leftSVG += `<text x="20" y="${H - 8}" font-family="ui-monospace,monospace" font-size="7" fill="${theme.muted}">github.com/${esc(owner)}/${esc(repo)}</text>`;
  }
  leftSVG += `<line x1="${DIVX}" y1="20" x2="${DIVX}" y2="${H - 20}" stroke="${theme.border}" stroke-width="1"/>`;

  // ── Right panel ────────────────────────────────────────────────────────
  let rightSVG = "";
  rows.forEach((row, ri) => {
    let x = DIVX + 14;
    const y = TOP_PAD + ri * (PH + GAP);
    row.forEach((p) => {
      rightSVG += renderPill(
        p,
        x,
        y,
        PH,
        PR,
        FS,
        IW,
        cfg.iconStyle,
        theme.accent,
        iconBase64Map
      );
      x += p.pw + GAP;
    });
  });

  if (cfg.dataFields.brandLabel) {
    rightSVG += `<text x="${W - 20}" y="${H - 8}" text-anchor="end" font-family="ui-monospace,monospace" font-size="7" fill="${theme.muted}">stackfingerprint.vercel.app</text>`;
  }

  return buildWrapper(
    W,
    H,
    scale,
    theme,
    cfg,
    owner,
    repo,
    stack.length,
    leftSVG + rightSVG
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Layout: CARDS ─────────────────────────────────────────────────────────────
// Each technology gets its own mini-card tile with icon + label + category
// badge. Displayed in a masonry-style grid. Best for a detailed showcase
// with 6–20 technologies.
// ══════════════════════════════════════════════════════════════════════════════
function buildCards(owner, repo, stack, theme, cfg, iconBase64Map) {
  const COLS = 4;
  const CW = 130,
    CH = 58,
    HGAP = 8,
    VGAP = 8,
    PAD = 16;
  const ICW = 22;

  // No cap — show all techs, grid expands
  const visible = stack;
  const overflow = 0;
  const rowCount = Math.ceil(visible.length / COLS);

  const W = COLS * (CW + HGAP) - HGAP + PAD * 2;
  const headerH = cfg.dataFields.repoName ? 44 : 0;
  const gridH = rowCount * (CH + VGAP) - VGAP;
  const footerH = cfg.dataFields.footerUrl ? 20 : 0;
  const H = headerH + PAD + gridH + PAD + footerH;

  const sizeObj = SIZES.find((s) => s.id === cfg.size) ?? SIZES[1];
  const scale = getSafeScale(sizeObj);
  const CR =
    cfg.pillShape === "square" ? 4 : cfg.pillShape === "round" ? 8 : 10;

  let tilesSVG = "";

  visible.forEach((tech, idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const tx = PAD + col * (CW + HGAP);
    const ty = headerH + PAD + row * (CH + VGAP);

    const fillColor = cfg.iconStyle === "mono" ? theme.accent : tech.color;
    const textC =
      cfg.iconStyle === "mono" ? "#ffffff" : (tech.textColor ?? "#ffffff");
    const iconHex = textC.replace("#", "").toLowerCase();
    const catLabel = CATEGORY_META[tech.category]?.label ?? tech.category;

    // Tile background
    tilesSVG += `<rect x="${tx}" y="${ty}" width="${CW}" height="${CH}" rx="${CR}" fill="${fillColor}" opacity="0.88"/>`;

    // Icon
    if (cfg.iconStyle !== "none" && tech.iconSlug) {
      const href = resolveIcon(tech.iconSlug, iconHex, iconBase64Map);
      if (href) {
        tilesSVG += `<image href="${href}" x="${tx + 10}" y="${ty + (CH - ICW) / 2}" width="${ICW}" height="${ICW}"/>`;
      }
    }

    // Tech name
    const nameX =
      cfg.iconStyle !== "none" && tech.iconSlug ? tx + 10 + ICW + 7 : tx + 10;
    tilesSVG += `<text x="${nameX}" y="${ty + CH / 2 - 4}" font-family="'Geist Mono','JetBrains Mono',ui-monospace,monospace" font-size="10" font-weight="700" fill="${textC}">${esc(tech.label)}</text>`;

    // Category badge
    tilesSVG += `<text x="${nameX}" y="${ty + CH / 2 + 9}" font-family="ui-monospace,monospace" font-size="7" fill="${textC}" opacity="0.6">${esc(catLabel.toUpperCase())}</text>`;
  });

  // Overflow tile
  if (overflow > 0 && cfg.dataFields.overflowBadge) {
    const col = visible.length % COLS;
    const row = Math.floor(visible.length / COLS);
    const tx = PAD + col * (CW + HGAP);
    const ty = headerH + PAD + row * (CH + VGAP);
    tilesSVG += `<rect x="${tx}" y="${ty}" width="${CW}" height="${CH}" rx="${CR}" fill="rgba(255,255,255,0.05)" stroke="${theme.border}" stroke-width="1"/>`;
    tilesSVG += `<text x="${tx + CW / 2}" y="${ty + CH / 2 + 4}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="11" fill="rgba(255,255,255,0.3)">+${overflow}</text>`;
  }

  return buildWrapper(
    W,
    H,
    scale,
    theme,
    cfg,
    owner,
    repo,
    stack.length,
    `
    ${
      cfg.dataFields.repoName
        ? `<text x="${PAD}" y="28" font-family="'Geist Mono','JetBrains Mono',ui-monospace,monospace" font-size="15" font-weight="700" letter-spacing="-0.2">
      <tspan fill="${theme.owner}">${esc(owner)}</tspan><tspan fill="${theme.slash}">/</tspan><tspan fill="${theme.title}">${esc(repo)}</tspan>
    </text>`
        : ""
    }
    ${tilesSVG}
    ${cfg.dataFields.footerUrl ? `<text x="${PAD}" y="${H - 6}" font-family="ui-monospace,monospace" font-size="7" fill="${theme.muted}">github.com/${esc(owner)}/${esc(repo)}</text>` : ""}
    ${cfg.dataFields.brandLabel ? `<text x="${W - PAD}" y="${H - 6}" text-anchor="end" font-family="ui-monospace,monospace" font-size="7" fill="${theme.muted}">stackfingerprint.vercel.app</text>` : ""}
  `
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Shared wrapper ─────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function buildWrapper(
  W,
  H,
  scale,
  theme,
  cfg,
  owner,
  repo,
  signalCount,
  innerSVG
) {
  const safeScale =
    typeof scale === "number" && isFinite(scale) && scale > 0 ? scale : 1;
  const sW = Math.round(W * safeScale);
  const sH = Math.round(H * safeScale);

  const bgParts = bgDecorationParts(cfg.bgDecoration, W, H, theme.accent);
  const accParts =
    cfg.accentLine !== "none"
      ? accentLineParts(cfg.accentLine, 22, 16, 52, theme.accent)
      : { defs: "", body: "" };

  const allDefs = [
    `<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg1}"/>
      <stop offset="100%" stop-color="${theme.bg2}"/>
    </linearGradient>`,
    `<linearGradient id="shimmer" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${theme.shimmer}"/>
      <stop offset="100%" stop-color="transparent"/>
    </linearGradient>`,
    `<clipPath id="card"><rect width="${W}" height="${H}" rx="14"/></clipPath>`,
    bgParts.defs,
    accParts.defs,
  ]
    .filter(Boolean)
    .join("\n    ");

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${sW}" height="${sH}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${allDefs}
  </defs>
  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#shimmer)"/>
    ${bgParts.body}
    <rect width="${W}" height="${H}" fill="none" stroke="${theme.border}" stroke-width="1"/>
    ${accParts.body}
    ${innerSVG}
  </g>
</svg>`;
}

// ── Main export ────────────────────────────────────────────────────────────
export function buildSVG(owner, repo, stack, cfg, iconBase64Map = null) {
  const theme = THEMES[cfg.theme] ?? THEMES.midnight;

  if (cfg.layout === "terminal") cfg.accentLine = "none";

  let filteredStack = stack;
  if (cfg.categoryFilter !== "all") {
    const filter = CATEGORY_FILTERS.find((f) => f.id === cfg.categoryFilter);
    if (filter?.include)
      filteredStack = stack.filter((t) => filter.include.includes(t.category));
  }

  switch (cfg.layout) {
    case "compact":
      return buildCompact(
        owner,
        repo,
        filteredStack,
        theme,
        cfg,
        iconBase64Map
      );
    case "banner":
      return buildBanner(owner, repo, filteredStack, theme, cfg, iconBase64Map);
    case "tall":
      return buildTall(owner, repo, filteredStack, theme, cfg, iconBase64Map);
    case "terminal":
      return buildTerminal(owner, repo, filteredStack, theme, cfg);
    case "minimal":
      return buildMinimal(
        owner,
        repo,
        filteredStack,
        theme,
        cfg,
        iconBase64Map
      );
    case "icons":
      return buildIcons(owner, repo, filteredStack, theme, cfg, iconBase64Map);
    case "sidebar":
      return buildSidebar(
        owner,
        repo,
        filteredStack,
        theme,
        cfg,
        iconBase64Map
      );
    case "split":
      return buildSplit(owner, repo, filteredStack, theme, cfg, iconBase64Map);
    case "cards":
      return buildCards(owner, repo, filteredStack, theme, cfg, iconBase64Map);
    default:
      return buildClassic(
        owner,
        repo,
        filteredStack,
        theme,
        cfg,
        iconBase64Map
      );
  }
}
