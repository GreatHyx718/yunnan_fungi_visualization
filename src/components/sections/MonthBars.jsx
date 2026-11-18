import { useEffect, useMemo, useRef, useState } from "react";
import { scaleLinear } from "d3-scale";
import { C, MONTH_ABBR, PEAK, fmt, records } from "../../utils/theme.js";
import { useTip } from "../../utils/ui.jsx";
import "../../styles/storyLayout.css";

const W = 880;
const H = 360;
const PAD = { l: 48, r: 16, t: 20, b: 40 };
// Months outside the highlight: greys with the same lightness as the light greens they replace
// (#a8c1b1 -> #b8b8b8, #d4e0d8 -> #dcdcdc).
const MUTED_EDIBLE = "#b8b8b8";
const MUTED_OTHER = "#dcdcdc";

export default function MonthBars() {
  const tip = useTip();
  // phase 0: all twelve months look alike; phase 1: June–September are highlighted
  const [phase, setPhase] = useState(0);
  const stepRefs = useRef([]);
  // June–September light up once the second paragraph has scrolled into the upper part of the screen,
  // and fall back when the reader scrolls up again
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = stepRefs.current[1];
      if (el) setPhase(el.getBoundingClientRect().top < window.innerHeight * 0.55 ? 1 : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
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
  const withMonth = records.length - noMonth;
  const peakShare = Math.round((peakN / withMonth) * 100);
  const august = rows[7].edible + rows[7].other;

  return (
    <section id="months" className="story-section">
      <div className="story-col story-col--blocks">
        <div className={`story-block${phase === 0 ? " is-active" : ""}`}>
          <header className="story-head">
            <h2>Observations by month</h2>
          </header>
          <p>Grandma never checks a calendar; she watches the sky. The data is blunter.</p>
        </div>
        <div className={`story-block${phase === 1 ? " is-active" : ""}`}>
          <p ref={(el) => (stepRefs.current[1] = el)}>
            There are {fmt(peakN)} entries from June to September, accounting for approximately {peakShare}% of the records that include
            month information. August has the highest number, with {fmt(august)} entries.
          </p>
          <p>June, July, August, and September, the four months. Let&rsquo;s open the basket month by month.</p>
        </div>
      </div>

      <div className="story-stage month-stage">
        <div className="month-chart">
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
            const lit = phase === 0 || peak; // in phase 1 only June–September stay in full colour
            const x = PAD.l + i * bw + bw * 0.14;
            const w = bw * 0.72;
            const colE = lit ? C.p400 : MUTED_EDIBLE;
            const colO = lit ? C.a400 : MUTED_OTHER;
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
                <text x={x + w / 2} y={H - PAD.b + 18} textAnchor="middle" className={phase === 1 && peak ? "axis strong" : "axis"}>
                  {MONTH_ABBR[i]}
                </text>
              </g>
            );
          })}
        </svg>
          <div className="legend">
            <span><i className="sw-chip" style={{ background: C.p400 }} /> Edible range <span className="zh">可食范围</span></span>
            <span><i className="sw-chip" style={{ background: C.a400 }} /> Other records <span className="zh">其他</span></span>
            {phase === 1 ? (
              <span className="legend-fade">
                <i className="sw-chip" style={{ background: MUTED_EDIBLE }} />
                <i className="sw-chip" style={{ background: MUTED_OTHER }} /> Other months
              </span>
            ) : null}
          </div>
        </div>
        {tip.node}
      </div>
    </section>
  );
}
