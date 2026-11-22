import { useState } from "react";

/** English label (the Chinese `zh` prop is ignored; the site is English only). */
export function Bi({ en }) {
  return <>{en}</>;
}

export function Step({ id, en, desc, children, wide }) {
  return (
    <section className={`step${wide ? " wide" : ""}`} id={id}>
      <div className="step-inner">
        <header className="step-head">
          <h2>{en}</h2>
          {desc ? <p className="sec-desc">{desc}</p> : null}
        </header>
        {children}
      </div>
    </section>
  );
}

export function Seg({ value, onChange, options }) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={value === o.value ? "on" : ""}
          onClick={() => onChange(o.value)}
        >
          <Bi en={o.en} zh={o.zh} />
        </button>
      ))}
    </div>
  );
}

export function Tabs({ value, onChange, options }) {
  return (
    <div className="tabs" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={`tab${value === o.value ? " on" : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Badge({ kind, children }) {
  return <span className={`badge-src src-${kind}`}>{children}</span>;
}

export function Tag({ kind, children }) {
  return <span className={`chip-tag t-${kind}`}>{children}</span>;
}

export function Alert({ kind = "info", children }) {
  const icon = { success: "✓", warning: "!", danger: "✕", info: "i" }[kind];
  return (
    <div className={`alert al-${kind}`}>
      <span className="alert-i">{icon}</span>
      <div>{children}</div>
    </div>
  );
}

export function Note({ children }) {
  return <p className="footnote">{children}</p>;
}

export function useTip() {
  const [t, setT] = useState(null);
  const show = (e, content) => setT({ x: e.clientX, y: e.clientY, content });
  const hide = () => setT(null);
  const node = t ? (
    <div
      className="tooltip"
      style={{
        left: Math.min(t.x + 14, window.innerWidth - 260),
        top: t.y + 14,
      }}
    >
      {t.content}
    </div>
  ) : null;
  return { show, hide, node };
}
