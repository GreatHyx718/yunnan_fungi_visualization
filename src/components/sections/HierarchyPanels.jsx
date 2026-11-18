import { fmt, FAMILY_ZH } from "../../utils/theme.js";
import { TAXON_ZH } from "../../utils/taxonNames.js";
import { LEVEL_ZH, NEXT_ZH, RANK_ZH, ancestorsOf } from "../../utils/taxonTree.js";

export const zhOf = (name) => TAXON_ZH[name] || null;

export function Legend({ tokens, mode, setMode }) {
  return (
    <div className="fn-legend">
      <div className="fn-legend-row">
        {LEVEL_ZH.map((label, i) => (
          <span key={label}>
            <i style={{ background: tokens.levels[i] }} />
            {label}
          </span>
        ))}
        <span>
          <i style={{ background: tokens.neutral }} />
          未鉴定
        </span>
      </div>
      <div className="fn-legend-row">
        <span>
          <i style={{ background: tokens.levels[3] }} />
          含已确认可食种
        </span>
        <span>
          <i style={{ background: "#f0f0f0", border: `1.5px solid ${tokens.levels[3]}`, boxSizing: "border-box" }} />
          不在可食范围内
        </span>
      </div>
      <div className="fn-legend-row chips">
        {[
          ["all", "全部"],
          ["edible", "含可食种"],
          ["toxic", "含有毒标记"],
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
  const zh = d.rank === "root" ? "云南菌菇" : zhOf(d.name) || (d.rank === "family" ? FAMILY_ZH[d.name] : null);
  const { count, ed, tox } = d;
  const path = ancestorsOf(d.parent || d)
    .filter((a) => a.rank !== "root" && a !== d)
    .reverse()
    .map((a) => zhOf(a.name) || a.name)
    .join(" › ");
  const latin = d.rank === "root" ? "Fungi" : d.rank === "unid" ? null : d.name;
  const realKids = d.children.filter((c) => c.rank !== "unid").length;
  const canEnter = d.children.length > 0 && d !== focus && ancestorsOf(d).includes(focus);
  return (
    <div className="fn-tip" style={{ left, top }}>
      <div className="fn-tip-head">
        <span className="fn-rank">{RANK_ZH[d.rank]}</span>
        <span className="fn-tip-zh">{zh || d.name}</span>
      </div>
      {zh && latin && latin !== zh ? <div className="fn-tip-la">{latin}</div> : null}
      {path ? <div className="fn-tip-path">{path}</div> : null}
      {d.children.length ? (
        <div className="fn-tip-path">
          下含 {realKids} 个{NEXT_ZH[d.rank]}
          {d.children.length > realKids ? "，另有未鉴定记录" : ""}
          {canEnter ? " · 滚轮向下或点击进入" : ""}
        </div>
      ) : null}
      <div className="fn-bar" aria-hidden="true">
        <i style={{ width: `${count ? (ed / count) * 100 : 0}%` }} />
      </div>
      <div className="fn-tip-n">
        {fmt(ed)} 条可食 / {fmt(count)} 条全部 · 占总记录 {((count / total) * 100).toFixed(1)}%
      </div>
      <div className="fn-tags">
        {ed > 0 ? <span className="chip-tag t-edible">{d.rank === "species" ? "在可食范围内" : "含已确认可食种"}</span> : null}
        {tox > 0 ? <span className="chip-tag t-toxic">含有毒标记种（{fmt(tox)} 条）</span> : null}
        {ed === 0 ? <span className="chip-tag" style={{ background: "#f0f0f0", color: "#5a5a5a" }}>无已确认可食种</span> : null}
      </div>
    </div>
  );
}
