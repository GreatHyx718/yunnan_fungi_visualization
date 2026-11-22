import { fmt } from "../../utils/theme.js";
import { LEVEL_LABEL, NEXT_PLURAL, RANK_LABEL, ancestorsOf } from "../../utils/taxonTree.js";

export function Legend({ tokens, mode, setMode }) {
  return (
    <div className="fn-legend">
      <div className="fn-legend-row">
        {LEVEL_LABEL.map((label, i) => (
          <span key={label}>
            <i style={{ background: tokens.levels[i] }} />
            {label}
          </span>
        ))}
        <span>
          <i style={{ background: tokens.neutral }} />
          Unidentified
        </span>
      </div>
      <div className="fn-legend-row">
        <span>
          <i style={{ background: tokens.levels[3] }} />
          Contains confirmed edible species
        </span>
        <span>
          <i style={{ background: "#f0f0f0", border: `1.5px solid ${tokens.levels[3]}`, boxSizing: "border-box" }} />
          Not in the edible range
        </span>
      </div>
      <div className="fn-legend-row chips">
        {[
          ["all", "All"],
          ["edible", "With edible species"],
          ["toxic", "With poisonous flag"],
        ].map(([v, label]) => (
          <button key={v} type="button" className={`chip-btn${mode === v ? " on" : ""}`} onClick={() => setMode(v)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function HoverCard({ node: d, x, y, total, focus }) {
  const left = Math.min(x + 16, window.innerWidth - 290);
  const top = Math.min(y + 16, window.innerHeight - 230);
  const title = d.rank === "root" ? "Fungi" : d.name;
  const { count, ed, tox } = d;
  const path = ancestorsOf(d.parent || d)
    .filter((a) => a.rank !== "root" && a !== d)
    .reverse()
    .map((a) => a.name)
    .join(" › ");
  const realKids = d.children.filter((c) => c.rank !== "unid").length;
  const canEnter = d.children.length > 0 && d !== focus && ancestorsOf(d).includes(focus);
  return (
    <div className="fn-tip" style={{ left, top }}>
      <div className="fn-tip-head">
        <span className="fn-rank">{RANK_LABEL[d.rank]}</span>
        <span className="fn-tip-zh">{title}</span>
      </div>
      {path ? <div className="fn-tip-path">{path}</div> : null}
      {d.children.length ? (
        <div className="fn-tip-path">
          Contains {realKids} {NEXT_PLURAL[d.rank]}
          {d.children.length > realKids ? ", plus unidentified records" : ""}
          {canEnter ? " · Scroll down or click to enter" : ""}
        </div>
      ) : null}
      <div className="fn-bar" aria-hidden="true">
        <i style={{ width: `${count ? (ed / count) * 100 : 0}%` }} />
      </div>
      <div className="fn-tip-n">
        {fmt(ed)} edible / {fmt(count)} total · {((count / total) * 100).toFixed(1)}% of all records
      </div>
      <div className="fn-tags">
        {ed > 0 ? <span className="chip-tag t-edible">{d.rank === "species" ? "In the edible range" : "Contains confirmed edible species"}</span> : null}
        {tox > 0 ? <span className="chip-tag t-toxic">Includes poisonous-flagged species ({fmt(tox)} records)</span> : null}
        {ed === 0 ? <span className="chip-tag" style={{ background: "#f0f0f0", color: "#5a5a5a" }}>No confirmed edible species</span> : null}
      </div>
    </div>
  );
}
