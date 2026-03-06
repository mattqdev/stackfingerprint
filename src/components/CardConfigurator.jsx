"use client";
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

const G = "#33ff33";
const FONT = "'JetBrains Mono', monospace";

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "9px",
          letterSpacing: "3px",
          textTransform: "uppercase",
          color: "rgba(51,255,51,0.35)",
          paddingBottom: "8px",
          marginBottom: "12px",
          borderBottom: "1px solid rgba(51,255,51,0.08)",
          fontFamily: FONT,
        }}
      >
        <span style={{ color: G }}>—</span> {title}
      </div>
      {children}
    </div>
  );
}

function PillGroup({ options, value, onChange, renderLabel }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          title={opt.desc}
          style={{
            padding: "6px 14px",
            fontSize: "10px",
            fontFamily: FONT,
            cursor: "pointer",
            transition: "all 0.15s",
            letterSpacing: "1px",
            border:
              value === opt.id
                ? "1px solid rgba(51,255,51,0.55)"
                : "1px solid rgba(51,255,51,0.12)",
            background:
              value === opt.id ? "rgba(51,255,51,0.08)" : "transparent",
            color: value === opt.id ? G : "rgba(51,255,51,0.4)",
            textShadow:
              value === opt.id ? "0 0 6px rgba(51,255,51,0.4)" : "none",
          }}
        >
          {renderLabel ? renderLabel(opt) : opt.label.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "5px 0",
        cursor: "pointer",
      }}
    >
      {/* Track */}
      <div
        style={{
          position: "relative",
          width: "28px",
          height: "16px",
          flexShrink: 0,
          border: checked
            ? "1px solid rgba(51,255,51,0.6)"
            : "1px solid rgba(51,255,51,0.15)",
          background: checked ? "rgba(51,255,51,0.08)" : "transparent",
          transition: "all 0.2s",
        }}
      >
        {/* Thumb */}
        <div
          style={{
            position: "absolute",
            top: "2px",
            left: checked ? "12px" : "2px",
            width: "10px",
            height: "10px",
            background: checked ? G : "rgba(51,255,51,0.25)",
            boxShadow: checked ? "0 0 6px rgba(51,255,51,0.6)" : "none",
            transition: "all 0.2s",
          }}
        />
      </div>
      <span
        style={{
          fontSize: "10px",
          fontFamily: FONT,
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: checked ? "rgba(51,255,51,0.7)" : "rgba(51,255,51,0.3)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default function CardConfigurator({ cfg, onChange }) {
  const set = (key, val) => onChange({ ...cfg, [key]: val });
  const setField = (key, val) =>
    onChange({ ...cfg, dataFields: { ...cfg.dataFields, [key]: val } });

  return (
    <div style={{ fontFamily: FONT }}>
      <Section title="Layout">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "8px",
          }}
        >
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              onClick={() => set("layout", l.id)}
              style={{
                textAlign: "left",
                padding: "12px",
                cursor: "pointer",
                transition: "all 0.15s",
                border:
                  cfg.layout === l.id
                    ? "1px solid rgba(51,255,51,0.5)"
                    : "1px solid rgba(51,255,51,0.1)",
                background:
                  cfg.layout === l.id ? "rgba(51,255,51,0.06)" : "transparent",
                fontFamily: FONT,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: cfg.layout === l.id ? G : "rgba(51,255,51,0.3)",
                  }}
                >
                  {l.icon}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    color: cfg.layout === l.id ? G : "rgba(51,255,51,0.5)",
                  }}
                >
                  {l.label.toUpperCase()}
                </span>
              </div>
              <div
                style={{
                  fontSize: "9px",
                  lineHeight: "1.4",
                  color: "rgba(51,255,51,0.3)",
                }}
              >
                {l.desc}
              </div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Theme">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
            gap: "6px",
            marginBottom: "8px",
          }}
        >
          {Object.entries(THEMES).map(([id, t]) => (
            <button
              key={id}
              onClick={() => set("theme", id)}
              title={t.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                padding: "8px 4px",
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: FONT,
                border:
                  cfg.theme === id
                    ? "1px solid rgba(51,255,51,0.5)"
                    : "1px solid rgba(51,255,51,0.1)",
                background:
                  cfg.theme === id ? "rgba(51,255,51,0.04)" : "transparent",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "18px",
                  background: `linear-gradient(135deg, ${t.bg1}, ${t.bg2})`,
                  border: `1px solid ${t.border}`,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "3px",
                    background: t.accent,
                    marginTop: "6px",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "8px",
                  letterSpacing: "1px",
                  color: cfg.theme === id ? G : "rgba(51,255,51,0.3)",
                }}
              >
                {t.label.slice(0, 6).toUpperCase()}
              </span>
            </button>
          ))}
        </div>
        <div
          style={{
            fontSize: "10px",
            color: "rgba(51,255,51,0.35)",
            marginTop: "4px",
          }}
        >
          {THEMES[cfg.theme]?.label ?? ""}
        </div>
      </Section>

      <Section title="Size">
        <PillGroup
          options={SIZES}
          value={cfg.size}
          onChange={(v) => set("size", v)}
        />
      </Section>

      <Section title="Icon Style">
        <PillGroup
          options={ICON_STYLES}
          value={cfg.iconStyle}
          onChange={(v) => set("iconStyle", v)}
        />
      </Section>

      <Section title="Pill Shape">
        <PillGroup
          options={PILL_SHAPES}
          value={cfg.pillShape}
          onChange={(v) => set("pillShape", v)}
        />
      </Section>

      <Section title="Categories">
        <PillGroup
          options={CATEGORY_FILTERS}
          value={cfg.categoryFilter}
          onChange={(v) => set("categoryFilter", v)}
        />
      </Section>

      <Section title="Accent Line">
        <PillGroup
          options={ACCENT_LINES}
          value={cfg.accentLine}
          onChange={(v) => set("accentLine", v)}
        />
      </Section>

      <Section title="Background">
        <PillGroup
          options={BG_DECORATIONS}
          value={cfg.bgDecoration}
          onChange={(v) => set("bgDecoration", v)}
        />
      </Section>

      <Section title="Fields">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px",
          }}
        >
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
