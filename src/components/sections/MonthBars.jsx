import { useMemo } from "react";
import { scaleLinear } from "d3-scale";
import { C, MONTH_ABBR, PEAK, fmt, records } from "../../utils/theme.js";
import { Bi, Note, Step, useTip } from "../../utils/ui.jsx";

const W = 880;
const H = 360;
const PAD = { l: 48, r: 16, t: 20, b: 40 };

export default function MonthBars() {
  const tip = useTip();
  const { rows, noMonth } = useMemo(() => {
    const rows = Array.from({ length: 12 }, (_, i) => ({ m: i + 1, edible: 0, other: 0 }));
    let noMonth = 0;
    for (const r of records) {
      if (!r.m) {
        noMonth++;
        continue;
      }
      rows[r.m - 1][r.ed ? "edible" : "other"]++;
    }
    return { rows, noMonth };
  }, []);
  const max = Math.max(...rows.map((r) => r.edible + r.other));
  const y = scaleLinear()
    .domain([0, Math.ceil(max / 100) * 100])
    .range([H - PAD.b, PAD.t]);
  const bw = (W - PAD.l - PAD.r) / 12;
  const peakN = rows.filter((r) => PEAK.includes(r.m)).reduce((a, r) => a + r.edible + r.other, 0);

  return (
    <Step
      id="months"
      en="Observations by month"
      zh="月份间观测数量"
      desc={`Records peak from June to September (${fmt(peakN)} of ${fmt(records.length - noMonth)} records with a month). Each bar is split into records in the edible range and all others.`}
      descZh="6–9 月为高发期；每根柱分为可食范围内与其他。"
    >
      <div className="panel">
        <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Stacked bar chart of records per month">
          {y.ticks(5).map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke={C.n100} />
              <text x={PAD.l - 8} y={y(t)} textAnchor="end" dy="0.33em" className="axis">
                {t}
              </text>
            </g>
          ))}
          {rows.map((r, i) => {
            const peak = PEAK.includes(r.m);
            const x = PAD.l + i * bw + bw * 0.14;
            const w = bw * 0.72;
            const colE = peak ? C.p400 : C.p200;
            const colO = peak ? C.a400 : C.n200;
            return (
              <g
                key={r.m}
                onMouseMove={(e) =>
                  tip.show(
                    e,
                    <>
                      <strong>{MONTH_ABBR[i]}</strong>
                      <div>{r.edible + r.other} records</div>
                      <div>In edible range: {r.edible}</div>
                      <div>Other: {r.other}</div>
                    </>,
                  )
                }
                onMouseLeave={tip.hide}
              >
                <rect x={x} y={y(r.edible)} width={w} height={y(0) - y(r.edible)} fill={colE} rx={2} />
                <rect x={x} y={y(r.edible + r.other)} width={w} height={y(r.edible) - y(r.edible + r.other)} fill={colO} rx={2} />
                <text x={x + w / 2} y={y(r.edible + r.other) - 6} textAnchor="middle" className="bar-n">
                  {r.edible + r.other}
                </text>
                <text x={x + w / 2} y={H - PAD.b + 18} textAnchor="middle" className={peak ? "axis strong" : "axis"}>
                  {MONTH_ABBR[i]}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="legend">
          <span><i className="sw-chip" style={{ background: C.p400 }} /> Edible range, Jun–Sep <span className="zh">可食范围</span></span>
          <span><i className="sw-chip" style={{ background: C.a400 }} /> Other, Jun–Sep <span className="zh">其他</span></span>
          <span><i className="sw-chip" style={{ background: C.p200 }} /> Edible range, other months</span>
          <span><i className="sw-chip" style={{ background: C.n200 }} /> Other, other months</span>
        </div>
        {tip.node}
      </div>
      <Note>
        {noMonth} records have no month and are left out. Counts come from all years (2010–2026) combined, so a few active years can drive the peak.
        <span className="zh"> 缺月份的记录 {noMonth} 条未计入。</span>
      </Note>
    </Step>
  );
}
