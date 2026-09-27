import { MARK_CORNERS, MARK_PRINT } from "./markPaths";

/* Primary mark: fingerprint inside a viewfinder. Always Paper White on black —
   never recolored, rotated or given effects (Brand Manual · 02 / Logo). */
export function Mark({ size = 32, scanning = false, className = "", title }) {
  return (
    <svg
      className={`sf-mark ${scanning ? "is-scanning" : ""} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <path d={MARK_CORNERS} />
      <g className="sf-mark-print">
        {MARK_PRINT.map((d, i) => (
          <path key={i} d={d} style={{ "--i": i }} />
        ))}
      </g>
    </svg>
  );
}

/* Horizontal lockup: mark + two-line Dela wordmark. Below 120px wide, use the mark alone. */
export function Lockup({ size = 34 }) {
  return (
    <span className="sf-lockup">
      <Mark size={size} />
      <span className="sf-lockup-word" style={{ fontSize: size * 0.42 }}>
        Stack
        <br />
        Fingerprint
      </span>
    </span>
  );
}

/* "FP" monogram — the signature, bottom-right of every visual. */
export function Monogram({ className = "" }) {
  return (
    <span className={`sf-monogram ${className}`} aria-hidden="true">
      FP
    </span>
  );
}

/* Signal Green highlight block — one per headline, on the key word, ALL CAPS. */
export function Highlight({ children }) {
  return <span className="sf-highlight">{children}</span>;
}

/* Section eyebrow: "01 / BRAND ESSENCE" */
export function Eyebrow({ index, children }) {
  return (
    <div className="sf-eyebrow">
      {index && <span>{index} / </span>}
      {children}
    </div>
  );
}

/* Viewfinder corners from the mark — frame a feature, screenshot or key number. */
export function Viewfinder({ children, className = "", active = false }) {
  return (
    <div className={`sf-viewfinder ${active ? "is-active" : ""} ${className}`}>
      <span className="vf-c vf-tl" />
      <span className="vf-c vf-tr" />
      <span className="vf-c vf-bl" />
      <span className="vf-c vf-br" />
      {children}
    </div>
  );
}
