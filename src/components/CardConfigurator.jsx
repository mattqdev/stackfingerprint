"use client";
// src/components/CardConfigurator.jsx
import {
  LAYOUTS,
  SIZES,
  ICON_STYLES,
  PILL_SHAPES,
  CATEGORY_FILTERS,
  DATA_FIELDS,
  ACCENT_LINES,
  BG_DECORATIONS,
} from "../data/cardOptions";
import { THEMES } from "../data/themes";

// ── Sub-components ─────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div>
      <div className="text-[9px] tracking-[2.5px] text-white/20 uppercase mb-2.5 font-mono">
        {title}
      </div>
      {children}
    </div>
  );
}

function PillGroup({ options, value, onChange, renderLabel }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          title={opt.desc}
          className={`text-[10px] font-mono px-2.5 py-1 rounded-md border transition-all
            ${
              value === opt.id
                ? "border-indigo-500/50 bg-indigo-500/12 text-indigo-300"
                : "border-white/8 text-white/30 hover:text-white/50 hover:border-white/15"
            }`}
        >
          {renderLabel ? renderLabel(opt) : opt.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-7 h-4 rounded-full border transition-all ${checked ? "bg-indigo-500/40 border-indigo-500/50" : "bg-white/5 border-white/10"}`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform ${checked ? "translate-x-3 bg-indigo-300" : "bg-white/25"}`}
        />
      </div>
      <span className="text-[10px] font-mono text-white/35 group-hover:text-white/50 transition-colors">
        {label}
      </span>
    </label>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function CardConfigurator({ cfg, onChange }) {
  const set = (key, val) => onChange({ ...cfg, [key]: val });
  const setField = (key, val) =>
    onChange({ ...cfg, dataFields: { ...cfg.dataFields, [key]: val } });

  return (
    <div className="space-y-5">
      {/* Layout */}
      <Section title="Layout">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              onClick={() => set("layout", l.id)}
              className={`text-left p-2.5 rounded-lg border transition-all
                ${
                  cfg.layout === l.id
                    ? "border-indigo-500/40 bg-indigo-500/8 text-indigo-300"
                    : "border-white/6 text-white/30 hover:border-white/12 hover:text-white/45"
                }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[13px] font-mono opacity-60">
                  {l.icon}
                </span>
                <span className="text-[10px] font-mono font-semibold tracking-wide">
                  {l.label}
                </span>
              </div>
              <div className="text-[9px] font-mono opacity-50 leading-relaxed">
                {l.desc}
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* Theme */}
      <Section title="Theme">
        <div className="grid grid-cols-5 gap-1.5">
          {Object.entries(THEMES).map(([id, t]) => (
            <button
              key={id}
              onClick={() => set("theme", id)}
              title={t.label}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all
                ${
                  cfg.theme === id
                    ? "border-indigo-500/40 bg-indigo-500/8"
                    : "border-white/6 hover:border-white/12"
                }`}
            >
              {/* Theme preview swatch */}
              <div
                className="w-8 h-5 rounded-md border border-white/10"
                style={{
                  background: `linear-gradient(135deg, ${t.bg1}, ${t.bg2})`,
                }}
              >
                <div
                  className="w-full h-0.5 rounded-t-md mt-1"
                  style={{ background: t.accent }}
                />
              </div>
              <span className="text-[8px] font-mono text-white/35 tracking-wide">
                {t.emoji}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-1.5 text-[10px] font-mono text-white/20">
          {THEMES[cfg.theme]?.label ?? ""}
        </div>
      </Section>

      {/* Size */}
      <Section title="Size">
        <PillGroup
          options={SIZES}
          value={cfg.size}
          onChange={(v) => set("size", v)}
        />
      </Section>

      {/* Icon style */}
      <Section title="Icon Style">
        <PillGroup
          options={ICON_STYLES}
          value={cfg.iconStyle}
          onChange={(v) => set("iconStyle", v)}
          renderLabel={(o) => (
            <>
              {o.label} <span className="text-white/20 ml-0.5">— {o.desc}</span>
            </>
          )}
        />
      </Section>

      {/* Pill shape */}
      <Section title="Pill Shape">
        <PillGroup
          options={PILL_SHAPES}
          value={cfg.pillShape}
          onChange={(v) => set("pillShape", v)}
        />
      </Section>

      {/* Category filter */}
      <Section title="Categories Shown">
        <PillGroup
          options={CATEGORY_FILTERS}
          value={cfg.categoryFilter}
          onChange={(v) => set("categoryFilter", v)}
        />
      </Section>

      {/* Accent line */}
      <Section title="Accent Line">
        <PillGroup
          options={ACCENT_LINES}
          value={cfg.accentLine}
          onChange={(v) => set("accentLine", v)}
        />
      </Section>

      {/* Background decoration */}
      <Section title="Background">
        <PillGroup
          options={BG_DECORATIONS}
          value={cfg.bgDecoration}
          onChange={(v) => set("bgDecoration", v)}
        />
      </Section>

      {/* Data fields */}
      <Section title="Show / Hide Fields">
        <div className="grid grid-cols-2 gap-2">
          {DATA_FIELDS.map((f) => (
            <Toggle
              key={f.id}
              checked={cfg.dataFields[f.id] ?? f.default}
              onChange={(v) => setField(f.id, v)}
              label={f.label}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}
