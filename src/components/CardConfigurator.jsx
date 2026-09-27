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

function Group({ title, hint, children }) {
  return (
    <div className="sf-cfg-group">
      <div className="sf-cfg-title">
        <span className="sf-label">{title}</span>
        {hint && <span className="hint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="sf-seg" role="radiogroup">
      {options.map((opt) => (
        <button
          key={opt.id}
          role="radio"
          aria-checked={value === opt.id}
          onClick={() => onChange(opt.id)}
          title={opt.desc}
          className={`sf-opt ${value === opt.id ? "is-on" : ""}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`sf-toggle ${checked ? "is-on" : ""}`}
    >
      {label}
      <span className="track" aria-hidden="true" />
    </button>
  );
}

export default function CardConfigurator({ cfg, onChange }) {
  const set = (key, val) => onChange({ ...cfg, [key]: val });
  const setField = (key, val) =>
    onChange({ ...cfg, dataFields: { ...cfg.dataFields, [key]: val } });

  return (
    <div>
      <Group
        title="Layout"
        hint={LAYOUTS.find((l) => l.id === cfg.layout)?.label}
      >
        <div className="sf-layouts" role="radiogroup">
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              role="radio"
              aria-checked={cfg.layout === l.id}
              onClick={() => set("layout", l.id)}
              className={`sf-layout ${cfg.layout === l.id ? "is-on" : ""}`}
            >
              <span className="ico" aria-hidden="true">
                {l.icon}
              </span>
              <span className="name">{l.label}</span>
              <span className="desc">{l.desc}</span>
            </button>
          ))}
        </div>
      </Group>

      <Group title="Theme" hint={THEMES[cfg.theme]?.label}>
        <div className="sf-themes" role="radiogroup">
          {Object.entries(THEMES).map(([id, t]) => (
            <button
              key={id}
              role="radio"
              aria-checked={cfg.theme === id}
              onClick={() => set("theme", id)}
              title={t.label}
              className={`sf-theme ${cfg.theme === id ? "is-on" : ""}`}
            >
              <span
                className="sw"
                style={{
                  background: `linear-gradient(135deg, ${t.bg1}, ${t.bg2})`,
                  boxShadow: `inset 0 0 0 ${t.strokeWidth ? 2 : 1}px ${t.stroke ?? t.border}`,
                }}
              >
                <i style={{ background: t.accent }} />
                <b style={{ background: t.title }} />
              </span>
              <span className="nm">{t.label}</span>
            </button>
          ))}
        </div>
      </Group>

      <Group title="Size">
        <Segmented
          options={SIZES}
          value={cfg.size}
          onChange={(v) => set("size", v)}
        />
      </Group>

      <Group title="Icon style">
        <Segmented
          options={ICON_STYLES}
          value={cfg.iconStyle}
          onChange={(v) => set("iconStyle", v)}
        />
      </Group>

      <Group title="Pill shape">
        <Segmented
          options={PILL_SHAPES}
          value={cfg.pillShape}
          onChange={(v) => set("pillShape", v)}
        />
      </Group>

      <Group title="Categories">
        <Segmented
          options={CATEGORY_FILTERS}
          value={cfg.categoryFilter}
          onChange={(v) => set("categoryFilter", v)}
        />
      </Group>

      <Group title="Accent line">
        <Segmented
          options={ACCENT_LINES}
          value={cfg.accentLine}
          onChange={(v) => set("accentLine", v)}
        />
      </Group>

      <Group title="Background">
        <Segmented
          options={BG_DECORATIONS}
          value={cfg.bgDecoration}
          onChange={(v) => set("bgDecoration", v)}
        />
      </Group>

      <Group title="Fields">
        <div className="sf-toggles">
          {DATA_FIELDS.map((f) => (
            <Toggle
              key={f.id}
              checked={cfg.dataFields[f.id] ?? f.default}
              onChange={(v) => setField(f.id, v)}
              label={f.label}
            />
          ))}
        </div>
      </Group>
    </div>
  );
}
