// src/lib/svgBuilder.js
import { THEMES } from "../data/themes";
import { LAYOUTS, SIZES, CATEGORY_FILTERS } from "../data/cardOptions";
import { CATEGORY_META } from "../data/signals";

// ── Icon URL / data-URI resolver ───────────────────────────────────────────
// iconBase64Map keys are "slug/hex" (lowercase, no #).
// When the map is provided (API route, server-side) we use the pre-fetched
// base64 data URI so the SVG contains no external URLs (fixes Camo CSP).
// When the map is null/undefined (browser preview) we fall back to the CDN.
function resolveIcon(slug, rawHex, iconBase64Map) {
  const hex = rawHex.replace("#", "").toLowerCase();
  if (iconBase64Map) {
    const val = iconBase64Map[`${slug}/${hex}`];
    // val is null  → fetch failed, skip icon
    // val is string → use data URI
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
  // FIX: SIZES uses "scale" — primary lookup, with fallbacks for safety
  const raw =
    sizeObj.scale ?? sizeObj.multiplier ?? sizeObj.value ?? sizeObj.factor ?? 1;
  return typeof raw === "number" && isFinite(raw) && raw > 0 ? raw : 1;
}

// ── Pill layout helper ─────────────────────────────────────────────────────
function layoutPills(pills, maxW, pillH, fontSize, iconW, gap, maxRows) {
  const rows = [];
  let row = [],
    rowW = 0;

  for (const p of pills) {
    const labelW = p.label.length * fontSize * 0.63 + iconW + 24;
    const pw = Math.max(58, labelW);
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

  // If no icon (missing slug or failed fetch), centre the text
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
// FIX: Returns { defs, body } so defs can be merged into a single <defs> block
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
// FIX: Returns { defs, body } to avoid duplicate <defs> blocks in the SVG
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

// ── Layout: CLASSIC ────────────────────────────────────────────────────────
function buildClassic(owner, repo, stack, theme, cfg, iconBase64Map) {
  const layout = LAYOUTS.find((l) => l.id === "classic");
  const sizeObj = SIZES.find((s) => s.id === cfg.size) ?? SIZES[1];
  const scale = getSafeScale(sizeObj);
  const W = layout.dims.w,
    H = layout.dims.h;
  const PH = 28,
    PR = cfg.pillShape === "square" ? 4 : cfg.pillShape === "round" ? 8 : 14;
  const FS = 11,
    IW = 14,
    GAP = 8;

  const visible = stack.slice(0, layout.maxPills);
  const overflow = stack.length - visible.length;
  const rows = layoutPills(visible, W, PH, FS, IW, GAP, 3);

  let pillsSVG = "";
  rows.forEach((row, ri) => {
    const totalW = row.reduce((a, p) => a + p.pw + GAP, -GAP);
    let x = (W - totalW) / 2;
    const y = 84 + ri * (PH + GAP);
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

  if (overflow > 0 && cfg.dataFields.overflowBadge && rows.length > 0) {
    const lr = rows[rows.length - 1];
    const totalW = lr.reduce((a, p) => a + p.pw + GAP, -GAP);
    const bx = (W + totalW) / 2 + GAP + 4;
    const by = 84 + (rows.length - 1) * (PH + GAP);
    pillsSVG += `<rect x="${bx}" y="${by}" width="30" height="${PH}" rx="${PR}" fill="rgba(255,255,255,0.06)" stroke="${theme.border}" stroke-width="1"/>
    <text x="${bx + 15}" y="${by + PH / 2 + 4}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="9" fill="rgba(255,255,255,0.35)">+${overflow}</text>`;
  }

  if (!stack.length)
    pillsSVG = `<text x="${W / 2}" y="130" text-anchor="middle" font-family="ui-monospace,monospace" font-size="12" fill="${theme.muted}">minimal stack detected</text>`;

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
    <text x="22" y="50" font-family="'Geist Mono','JetBrains Mono',ui-monospace,monospace" font-size="20" font-weight="700" letter-spacing="-0.3">
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

// ── Layout: COMPACT ────────────────────────────────────────────────────────
function buildCompact(owner, repo, stack, theme, cfg, iconBase64Map) {
  const W = 500,
    H = 110;
  const sizeObj = SIZES.find((s) => s.id === cfg.size) ?? SIZES[1];
  const scale = getSafeScale(sizeObj);
  const PH = 22,
    PR = cfg.pillShape === "square" ? 3 : cfg.pillShape === "round" ? 6 : 11;
  const FS = 9,
    IW = 11,
    GAP = 6;

  const visible = stack.slice(0, 7);
  const overflow = stack.length - visible.length;
  const rows = layoutPills(visible, W, PH, FS, IW, GAP, 1);

  let pillsSVG = "";
  if (rows[0]) {
    const totalW = rows[0].reduce((a, p) => a + p.pw + GAP, -GAP);
    let x = (W - totalW) / 2;
    const y = 58;
    rows[0].forEach((p) => {
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
  }

  if (overflow > 0 && cfg.dataFields.overflowBadge && rows[0]) {
    const totalW = rows[0].reduce((a, p) => a + p.pw + GAP, -GAP);
    const bx = (W + totalW) / 2 + 10;
    pillsSVG += `<rect x="${bx}" y="58" width="26" height="${PH}" rx="${PR}" fill="rgba(255,255,255,0.06)" stroke="${theme.border}" stroke-width="1"/>
    <text x="${bx + 13}" y="${58 + PH / 2 + 3.5}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="8" fill="rgba(255,255,255,0.35)">+${overflow}</text>`;
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
    <text x="20" y="36" font-family="'Geist Mono','JetBrains Mono',ui-monospace,monospace" font-size="14" font-weight="700" letter-spacing="-0.2">
      <tspan fill="${theme.owner}">${esc(owner)}</tspan><tspan fill="${theme.slash}">/</tspan><tspan fill="${theme.title}">${esc(repo)}</tspan>
    </text>`
        : ""
    }
    ${cfg.dataFields.signalCount ? `<text x="20" y="48" font-family="ui-monospace,monospace" font-size="8" fill="${theme.sub}" letter-spacing="1.5">${stack.length} SIGNALS</text>` : ""}
    ${pillsSVG}
    ${cfg.dataFields.footerUrl ? `<text x="${W / 2}" y="${H - 10}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="7" fill="${theme.muted}">github.com/${esc(owner)}/${esc(repo)}</text>` : ""}
  `
  );
}

// ── Layout: BANNER ─────────────────────────────────────────────────────────
function buildBanner(owner, repo, stack, theme, cfg, iconBase64Map) {
  const W = 760,
    H = 180;
  const sizeObj = SIZES.find((s) => s.id === cfg.size) ?? SIZES[1];
  const scale = getSafeScale(sizeObj);
  const PH = 26,
    PR = cfg.pillShape === "square" ? 4 : cfg.pillShape === "round" ? 8 : 13;
  const FS = 10,
    IW = 13,
    GAP = 7;

  const visible = stack.slice(0, 24);
  const overflow = stack.length - visible.length;
  const rows = layoutPills(visible, W, PH, FS, IW, GAP, 2);

  let pillsSVG = "";
  rows.forEach((row, ri) => {
    const totalW = row.reduce((a, p) => a + p.pw + GAP, -GAP);
    let x = (W - totalW) / 2;
    const y = 70 + ri * (PH + 8);
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

  if (overflow > 0 && cfg.dataFields.overflowBadge && rows.length > 0) {
    const lr = rows[rows.length - 1];
    const totalW = lr.reduce((a, p) => a + p.pw + GAP, -GAP);
    const bx = (W + totalW) / 2 + GAP + 4;
    const by = 70 + (rows.length - 1) * (PH + 8);
    pillsSVG += `<rect x="${bx}" y="${by}" width="28" height="${PH}" rx="${PR}" fill="rgba(255,255,255,0.06)" stroke="${theme.border}" stroke-width="1"/>
    <text x="${bx + 14}" y="${by + PH / 2 + 3.5}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="8" fill="rgba(255,255,255,0.35)">+${overflow}</text>`;
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
    <text x="24" y="44" font-family="'Geist Mono','JetBrains Mono',ui-monospace,monospace" font-size="18" font-weight="700" letter-spacing="-0.3">
      <tspan fill="${theme.owner}">${esc(owner)}</tspan><tspan fill="${theme.slash}">/</tspan><tspan fill="${theme.title}">${esc(repo)}</tspan>
    </text>`
        : ""
    }
    ${cfg.dataFields.signalCount ? `<text x="24" y="58" font-family="ui-monospace,monospace" font-size="9" fill="${theme.sub}" letter-spacing="1.5">STACK FINGERPRINT · ${stack.length} SIGNALS</text>` : ""}
    ${pillsSVG}
    ${cfg.dataFields.footerUrl ? `<text x="24" y="${H - 12}" font-family="ui-monospace,monospace" font-size="8" fill="${theme.muted}">github.com/${esc(owner)}/${esc(repo)}</text>` : ""}
    ${cfg.dataFields.brandLabel ? `<text x="${W - 24}" y="${H - 12}" text-anchor="end" font-family="ui-monospace,monospace" font-size="8" fill="${theme.muted}">stackfingerprint.vercel.app</text>` : ""}
  `
  );
}

// ── Layout: TALL (portrait, grouped) ──────────────────────────────────────
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

  const catOrder = {
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
  const groups = {};
  stack.forEach((t) => {
    if (!groups[t.category]) groups[t.category] = [];
    groups[t.category].push(t);
  });

  let pillsSVG = "",
    curY = 76;

  Object.entries(groups)
    .sort(([a], [b]) => (catOrder[a] ?? 99) - (catOrder[b] ?? 99))
    .forEach(([cat, items]) => {
      const catLabel = CATEGORY_META[cat]?.label ?? cat;
      pillsSVG += `<text x="18" y="${curY}" font-family="ui-monospace,monospace" font-size="8" fill="${theme.sub}" letter-spacing="2">${catLabel.toUpperCase()}</text>`;
      curY += 14;
      let x = 18;
      items.forEach((p, i) => {
        const labelW = p.label.length * FS * 0.63 + IW + 24;
        const pw = Math.max(60, labelW);
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
        ? `
    <text x="18" y="38" font-family="'Geist Mono','JetBrains Mono',ui-monospace,monospace" font-size="15" font-weight="700" letter-spacing="-0.2">
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

// ── Layout: TERMINAL (text only — no icons needed) ────────────────────────
function buildTerminal(owner, repo, stack, theme, cfg) {
  const W = 600,
    H = 280;
  const sizeObj = SIZES.find((s) => s.id === cfg.size) ?? SIZES[1];
  const scale = getSafeScale(sizeObj);

  const catOrder = {
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
  const groups = {};
  stack.forEach((t) => {
    if (!groups[t.category]) groups[t.category] = [];
    groups[t.category].push(t);
  });

  const lines = [];
  lines.push({
    prompt: "$",
    cmd: `stack-fingerprint scan ${owner}/${repo}`,
    color: theme.title,
  });
  lines.push({ prompt: "", cmd: "", color: "transparent" });

  Object.entries(groups)
    .sort(([a], [b]) => (catOrder[a] ?? 99) - (catOrder[b] ?? 99))
    .slice(0, 8)
    .forEach(([cat, items]) => {
      const label = (CATEGORY_META[cat]?.label ?? cat).padEnd(12);
      const vals = items.map((i) => i.label).join(", ");
      lines.push({ label, vals });
    });

  lines.push({ prompt: "", cmd: "", color: "transparent" });
  lines.push({
    prompt: "✓",
    cmd: `${stack.length} signals detected`,
    color: theme.accent,
  });

  const lineH = 18,
    startY = 54;
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
    ${cfg.dataFields.footerUrl ? `<text x="22" y="${H - 12}" font-family="ui-monospace,monospace" font-size="7.5" fill="${theme.muted}">github.com/${esc(owner)}/${esc(repo)}</text>` : ""}
    ${cfg.dataFields.brandLabel ? `<text x="${W - 22}" y="${H - 12}" text-anchor="end" font-family="ui-monospace,monospace" font-size="7.5" fill="${theme.muted}">stackfingerprint.vercel.app</text>` : ""}
  `
  );
}

// ── Shared wrapper ─────────────────────────────────────────────────────────
// FIX: All <defs> are now merged into a single block to produce valid SVG.
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

  // Collect all defs from decorations and accent line
  const bgParts = bgDecorationParts(cfg.bgDecoration, W, H, theme.accent);
  const accParts =
    cfg.accentLine !== "none"
      ? accentLineParts(cfg.accentLine, 22, 16, 52, theme.accent)
      : { defs: "", body: "" };

  // Merge all defs into one block
  const allDefs = [
    // Core gradients
    `<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg1}"/>
      <stop offset="100%" stop-color="${theme.bg2}"/>
    </linearGradient>`,
    `<linearGradient id="shimmer" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${theme.shimmer}"/>
      <stop offset="100%" stop-color="transparent"/>
    </linearGradient>`,
    `<clipPath id="card"><rect width="${W}" height="${H}" rx="14"/></clipPath>`,
    // Background decoration defs
    bgParts.defs,
    // Accent line defs
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
// iconBase64Map: passed by the API route (server-side, CSP-safe).
//               null/undefined in the browser preview (falls back to CDN URLs).
export function buildSVG(owner, repo, stack, cfg, iconBase64Map = null) {
  const theme = THEMES[cfg.theme] ?? THEMES.midnight;

  if (cfg.layout === "terminal") {
    cfg.accentLine = "none";
  }

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
