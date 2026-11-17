import { scaleLinear } from "d3-scale";
import { C, MONTH_ABBR, cdc } from "../../utils/theme.js";
import { Alert, Badge, Bi, Note, Step, useTip } from "../../utils/ui.jsx";

const W = 440;
const H = 260;
const PAD = { l: 40, r: 12, t: 22, b: 30 };

function Bars({ rows, x, y, color, label, tip }) {
  const bw = (W - PAD.l - PAD.r) / rows.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart">
      {y.ticks(4).map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke={C.n100} />
          <text x={PAD.l - 6} y={y(t)} dy="0.33em" textAnchor="end" className="axis">
            {t}
          </text>
        </g>
      ))}
      {rows.map((r, i) => {
        const v = r.v;
        const xx = PAD.l + i * bw + bw * 0.18;
        return (
          <g
            key={i}
            onMouseMove={(e) => tip.show(e, <><strong>{r.l}</strong><div>{v} {label}</div></>)}
            onMouseLeave={tip.hide}
          >
            <rect x={xx} y={y(v)} width={bw * 0.64} height={y(0) - y(v)} fill={r.c || color} rx={2} />
            <text x={xx + bw * 0.32} y={y(v) - 5} textAnchor="middle" className="bar-n">
              {v}
            </text>
            <text x={xx + bw * 0.32} y={H - PAD.b + 16} textAnchor="middle" className="axis">
              {r.l}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Poison() {
  const tip = useTip();
  const annual = cdc.annual;
  const yp = scaleLinear().domain([0, 450]).range([H - PAD.b, PAD.t]);
  const yd = scaleLinear().domain([0, 10]).range([H - PAD.b, PAD.t]);

  const timing = cdc.timing;
  const yt = scaleLinear().domain([0, 500]).range([H - PAD.b, PAD.t]);
  const bw = (W - PAD.l - PAD.r) / timing.length;

  const m25 = cdc.monthly2025;
  const y25 = scaleLinear().domain([0, 40]).range([H - PAD.b, PAD.t]);

  return (
    <Step
      id="poisoning"
      num="09"
      en="Part III · Poisoning in Yunnan"
      zh="云南中毒数据"
      desc="China CDC reports give province-level poisoning counts for Yunnan. They are shown next to the GBIF records, not combined with them."
      descZh="CDC 数据与 GBIF 观测并列展示，不做相关计算。"
      wide
    >
      <div className="tm-grid three">
        <div className="panel">
          <div className="panel-label">
            <Bi en="9a · Patients per year" zh="年度中毒人数" /> <Badge kind="cdc">CDC</Badge>
          </div>
          <Bars rows={annual.map((a) => ({ l: a.year, v: a.patients }))} x={null} y={yp} color={C.signal} label="patients" tip={tip} />
        </div>
        <div className="panel">
          <div className="panel-label">
            <Bi en="9a · Deaths per year" zh="年度死亡数" /> <Badge kind="cdc">CDC</Badge>
          </div>
          <Bars rows={annual.map((a) => ({ l: a.year, v: a.deaths }))} x={null} y={yd} color={C.signalDeep} label="deaths" tip={tip} />
        </div>
        <div className="panel">
          <div className="panel-label">
            <Bi en="9b · Records, Jun–Sep, all years" zh="总记录 vs 毒蘑菇记录" /> <Badge kind="gbif">GBIF</Badge>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="chart">
            {yt.ticks(5).map((t) => (
              <g key={t}>
                <line x1={PAD.l} x2={W - PAD.r} y1={yt(t)} y2={yt(t)} stroke={C.n100} />
                <text x={PAD.l - 6} y={yt(t)} dy="0.33em" textAnchor="end" className="axis">{t}</text>
              </g>
            ))}
            {timing.map((r, i) => {
              const x0 = PAD.l + i * bw + bw * 0.12;
              const w = bw * 0.38;
              return (
                <g
                  key={r.month}
                  onMouseMove={(e) => tip.show(e, <><strong>{MONTH_ABBR[r.month - 1]}</strong><div>All records: {r.total}</div><div>Toxic-flagged: {r.toxic}</div></>)}
                  onMouseLeave={tip.hide}
                >
                  <rect x={x0} y={yt(r.total)} width={w} height={yt(0) - yt(r.total)} fill={C.a400} rx={2} />
                  <rect x={x0 + w + 4} y={yt(r.toxic)} width={w} height={yt(0) - yt(r.toxic)} fill={C.signal} rx={2} />
                  <text x={x0 + w / 2} y={yt(r.total) - 5} textAnchor="middle" className="bar-n">{r.total}</text>
                  <text x={x0 + w + 4 + w / 2} y={yt(r.toxic) - 5} textAnchor="middle" className="bar-n">{r.toxic}</text>
                  <text x={x0 + w + 2} y={H - PAD.b + 16} textAnchor="middle" className="axis">{MONTH_ABBR[r.month - 1]}</text>
                </g>
              );
            })}
          </svg>
          <div className="legend">
            <span><i className="sw-chip" style={{ background: C.a400 }} /> All records</span>
            <span><i className="sw-chip" style={{ background: C.signal }} /> Toxic-flagged records</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-label">
          <Bi en="9c · Poisoning incidents per month, 2025 only" zh="2025 年云南月度中毒起数" /> <Badge kind="cdc">CDC</Badge>
        </div>
        <svg viewBox={`0 0 ${W * 2} ${H}`} className="chart wide-chart">
          {y25.ticks(4).map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W * 2 - PAD.r} y1={y25(t)} y2={y25(t)} stroke={C.n100} />
              <text x={PAD.l - 6} y={y25(t)} dy="0.33em" textAnchor="end" className="axis">{t}</text>
            </g>
          ))}
          {m25.map((r, i) => {
            const b = (W * 2 - PAD.l - PAD.r) / 12;
            const x0 = PAD.l + i * b + b * 0.18;
            const peak = r.month >= 6 && r.month <= 9;
            return (
              <g key={r.month} onMouseMove={(e) => tip.show(e, <><strong>{MONTH_ABBR[i]} 2025</strong><div>{r.incidents} incidents</div></>)} onMouseLeave={tip.hide}>
                <rect x={x0} y={y25(r.incidents)} width={b * 0.64} height={y25(0) - y25(r.incidents)} fill={peak ? C.signal : "#d9c8bc"} rx={2} />
                <text x={x0 + b * 0.32} y={y25(r.incidents) - 5} textAnchor="middle" className="bar-n">{r.incidents}</text>
                <text x={x0 + b * 0.32} y={H - PAD.b + 16} textAnchor="middle" className="axis">{MONTH_ABBR[i]}</text>
              </g>
            );
          })}
        </svg>
        <p className="small">Total 109 incidents in 2025. Counts of incidents only, with no patient numbers.</p>
      </div>
      {tip.node}

      <div className="alert-grid">
        <Alert kind="warning">
          The GBIF records span all years (2010–2026) and the CDC months are 2025 only. The two are shown side by side and not compared statistically.
          <span className="zh">口径不同，只并列展示。</span>
        </Alert>
        <Alert kind="info">
          “Toxic-flagged” means species marked poisonous (P) in Wu 2019 or Zhang 2021, plus species with a non-edible clinical group in CDC tables. This is a wide definition: it includes species that are edible but flagged, such as <i>Coprinus comatus</i> and <i>Butyriboletus roseoflavus</i>, which alone make up 12 of the 30 June records.
        </Alert>
        <Alert kind="warning">
          2019 has only a death count (14) and no patient count, so it is left out of 9a. CDC table parsing is incomplete, so the true number of toxic-flagged records may be higher.
        </Alert>
      </div>
      <Note>
        Sources: China CDC Weekly foodborne outbreak reports 2019–2025 (province tables; 2025 Figure 2 heatmap row matched by total = 109); GBIF; Wu 2019 and Zhang 2021 species tables.
      </Note>
    </Step>
  );
}
