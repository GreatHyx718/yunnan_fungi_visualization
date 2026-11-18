import { useMemo, useState } from "react";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import { C, FAMILY_ZH, OTHER_COLOR, PEAK, familyColor, records, textOn } from "../../utils/theme.js";
import { Alert, Bi, Note, Step, useTip } from "../../utils/ui.jsx";

const W = 420;
const H = 300;
const UNID = "Unidentified";
const OTHER = "Other families";

function monthTree(m) {
  const rs = records.filter((r) => r.m === m);
  const by = new Map();
  for (const r of rs) {
    const k = r.fa || UNID;
    const o = by.get(k) || { name: k, n: 0, edible: 0, flagged: 0 };
    o.n++;
    if (r.ed) o.edible++;
    if (r.ed === 2) o.flagged++;
    by.set(k, o);
  }
  const all = [...by.values()].sort((a, b) => b.n - a.n);
  const keep = [];
  const other = { name: OTHER, n: 0, edible: 0, flagged: 0, parts: 0 };
  for (const o of all) {
    // Tiny tiles are merged, unless they carry a toxicity flag or are the unidentified block.
    if (o.name === UNID || o.n / rs.length >= 0.03 || o.flagged > 0) keep.push(o);
    else {
      other.n += o.n;
      other.edible += o.edible;
      other.parts++;
    }
  }
  if (other.n) keep.push(other);
  return { n: rs.length, families: all.length, leaves: keep };
}

function layout(tree) {
  const root = hierarchy({ children: tree.leaves }).sum((d) => d.n || 0);
  treemap().tile(treemapSquarify).size([W, H]).paddingInner(2)(root);
  return root.leaves();
}

export default function Treemaps() {
  const [sel, setSel] = useState(null);
  const tip = useTip();
  const months = useMemo(() => PEAK.map((m) => ({ m, tree: monthTree(m) })).map((o) => ({ ...o, leaves: layout(o.tree) })), []);

  return (
    <Step
      id="composition"
      en="What was recorded each month"
      zh="6–9 月每月的菌类构成"
      desc="One treemap per month, grouped by family. Tile area is the share of that month's records. Tiles marked ▲ contain records of species the literature also lists as poisonous."
      descZh="每月一张矩形树图，按科；▲ 表示含有毒标记的记录。"
      wide
    >
      <div className="tm-grid">
        {months.map(({ m, tree, leaves }) => (
          <div className="panel" key={m}>
            <div className="panel-label">
              <Bi en={`${["June", "July", "August", "September"][m - 6]}`} zh={`${m} 月`} /> <span className="n-badge">n = {tree.n}</span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`Treemap of families in month ${m}`}>
              {leaves.map((l) => {
                const d = l.data;
                const w = l.x1 - l.x0;
                const h = l.y1 - l.y0;
                const color = d.name === UNID ? "#d9d9d4" : d.name === OTHER ? OTHER_COLOR : familyColor(d.name);
                const isSel = sel === d.name;
                const label = d.name === OTHER ? `Other (${d.parts})` : d.name;
                return (
                  <g
                    key={d.name}
                    transform={`translate(${l.x0},${l.y0})`}
                    className="tile"
                    onClick={() => setSel(isSel ? null : d.name)}
                    onMouseMove={(e) =>
                      tip.show(
                        e,
                        <>
                          <strong>{d.name}</strong>
                          {FAMILY_ZH[d.name] ? <span className="zh">{FAMILY_ZH[d.name]}</span> : null}
                          <div>
                            {d.n} records · {((d.n / tree.n) * 100).toFixed(0)}% of {tree.n}
                          </div>
                          <div>In edible range: {d.edible}</div>
                          {d.flagged ? <div className="tip-warn">Flagged poisonous in literature: {d.flagged}</div> : null}
                        </>,
                      )
                    }
                    onMouseLeave={tip.hide}
                  >
                    <rect
                      width={w}
                      height={h}
                      fill={color}
                      stroke={isSel ? C.p400 : d.flagged ? C.signal : "none"}
                      strokeWidth={isSel ? 3 : 2}
                      rx={3}
                      opacity={sel && !isSel ? 0.45 : 1}
                    />
                    {w > 58 && h > 22 ? (
                      <text x={6} y={16} fill={textOn(color)} className="tile-t">
                        {label.length * 6.4 > w - 12 ? label.slice(0, Math.floor((w - 12) / 6.4) - 1) + "…" : label}
                      </text>
                    ) : null}
                    {w > 34 && h > 36 ? (
                      <text x={6} y={31} fill={textOn(color)} className="tile-s">
                        {d.n}
                      </text>
                    ) : null}
                    {d.flagged ? (
                      <text x={w - 6} y={14} textAnchor="end" fill={textOn(color)} className="tile-s">
                        ▲
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </svg>
            <p className="small">{tree.families} families, {tree.leaves.length} tiles shown.</p>
          </div>
        ))}
      </div>
      {tip.node}
      {sel ? (
        <div className="panel fam-detail">
          <strong>{sel}</strong> {FAMILY_ZH[sel] ? <span className="zh">{FAMILY_ZH[sel]}</span> : null}
          <div className="fam-detail-row">
            {months.map(({ m, tree }) => {
              const d = tree.leaves.find((x) => x.name === sel);
              return (
                <span key={m}>
                  {["Jun", "Jul", "Aug", "Sep"][m - 6]}: <b>{d ? d.n : 0}</b>
                </span>
              );
            })}
          </div>
        </div>
      ) : null}
      <Alert kind="warning">
        Each panel shows its own n. June has 95 records in 55 genera, so small tiles are merged into “Other families”; records without a family sit in “Unidentified”.
        <span className="zh">需标注 n，小方块合并为“其他”，无科名的记录归入“未鉴定”。</span>
      </Alert>
      <Note>Click a tile to compare the same family across the four months.</Note>
    </Step>
  );
}
