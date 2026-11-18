import { useEffect, useMemo, useRef, useState } from "react";
import { C, FAMILY_ZH, MONTH_ABBR, PEAK, familyColor, prefName, records } from "../../utils/theme.js";
import { Badge, Bi, Step, Tabs, Tag } from "../../utils/ui.jsx";
import { MONTH_NAME, RankBars, byMonth } from "./Top5.jsx";

const monthEdible = Object.fromEntries(PEAK.map((m) => [m, records.filter((r) => r.m === m && r.ed).length]));

function familyStats(family) {
  const all = records.filter((r) => r.fa === family);
  const ed = all.filter((r) => r.ed);
  const perMonth = PEAK.map((m) => ed.filter((r) => r.m === m).length);
  const coord = ed.filter((r) => r.pf != null);
  const prefs = new Map();
  for (const r of coord) prefs.set(r.pf, (prefs.get(r.pf) || 0) + 1);
  const top3 = [...prefs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const dem = coord.map((r) => r.el).filter((v) => v != null).sort((a, b) => a - b);
  return {
    all: all.length,
    edible: ed.length,
    notEdible: all.length - ed.length,
    flagged: ed.filter((r) => r.ed === 2).length,
    perMonth,
    coord: coord.length,
    top3,
    dem,
    species: new Set(all.map((r) => r.sp).filter(Boolean)).size,
  };
}

function MonthMini({ values, totals }) {
  const max = Math.max(...values, 1);
  return (
    <div className="mini-bars">
      {values.map((v, i) => (
        <div key={i} className="mini-col">
          <span className="mini-n">{v}</span>
          <i style={{ height: `${(v / max) * 52 + (v ? 2 : 0)}px` }} />
          <span className="mini-m">{MONTH_ABBR[PEAK[i] - 1]}</span>
          <span className="mini-share">{totals[i] ? `${((v / totals[i]) * 100).toFixed(0)}%` : "–"}</span>
        </div>
      ))}
    </div>
  );
}

function ElevationStrip({ dem }) {
  const lo = 0;
  const hi = 5200;
  if (!dem.length) return <p className="small">No coordinates, so no elevation estimate.</p>;
  const med = dem[Math.floor(dem.length / 2)];
  const x = (v) => ((v - lo) / (hi - lo)) * 100;
  return (
    <div className="elev">
      <div className="elev-track">
        {dem.map((v, i) => (
          <i key={i} className="elev-dot" style={{ left: `${x(v)}%` }} />
        ))}
        <b className="elev-med" style={{ left: `${x(med)}%` }} />
      </div>
      <div className="elev-axis">
        <span>0</span>
        <span>2,500</span>
        <span>5,000 m</span>
      </div>
      <p className="small">
        n = {dem.length}, median {Math.round(med)} m, range {Math.round(dem[0])}–{Math.round(dem[dem.length - 1])} m
      </p>
    </div>
  );
}

function Card({ family, month }) {
  const s = useMemo(() => familyStats(family), [family]);
  const monthRow = byMonth(month).find((r) => r.family === family);
  const totals = PEAK.map((m) => monthEdible[m]);
  return (
    <article className="card" style={{ "--fam": familyColor(family) }}>
      <header>
        <h3>
          {family} <span className="zh">{FAMILY_ZH[family]}</span>
        </h3>
        <div className="tags">
          <Tag kind="edible">Edible range 可食用</Tag>
          {s.flagged ? <Tag kind="toxic">Includes poisonous flag 含有毒标记</Tag> : null}
          <Tag kind="family">{s.species} species</Tag>
        </div>
      </header>
      <div className="stats3">
        <div>
          <b>{s.all}</b>
          <span>All records 全部记录</span>
        </div>
        <div>
          <b>{s.edible}</b>
          <span>Edible range 可食记录</span>
        </div>
        <div>
          <b>{s.notEdible}</b>
          <span>Not edible range 不在可食范围</span>
        </div>
      </div>
      <h4>
        <Bi en="Edible records, Jun–Sep (and share of that month)" zh="6–9 月分布与月内占比" />
      </h4>
      <MonthMini values={s.perMonth} totals={totals} />
      <h4>
        <Bi en="Elevation" zh="海拔" /> <Badge kind="dem">DEM estimate ±200 m</Badge>
      </h4>
      <ElevationStrip dem={s.dem} />
      <h4>
        <Bi en="Top 3 prefectures (edible records, counts)" zh="记录最多的州市" />
      </h4>
      <ol className="top3">
        {s.top3.length ? (
          s.top3.map(([id, n]) => (
            <li key={id}>
              {prefName.get(id).en} <span className="zh">{prefName.get(id).zh}</span> <b>{n}</b>
            </li>
          ))
        ) : (
          <li>No coordinates</li>
        )}
      </ol>
      <p className="small">
        Based on {s.coord} edible records with coordinates; each prefecture holds only a few.
      </p>
      <p className="scope">
        This family has {s.all} records in total, {s.notEdible} of them outside the edible range. <b>Observation ≠ edibility.</b>
        <span className="zh">该科全部记录 {s.all} 条，不在可食范围 {s.notEdible} 条。观测 ≠ 可食用。</span>
      </p>
      {monthRow ? (
        <p className="small">
          {MONTH_NAME[month]}: {monthRow.records} of {monthRow.monthTotal} edible records (n small, read with care).
        </p>
      ) : null}
    </article>
  );
}

export default function FamilyCards() {
  const [month, setMonth] = useState(6);
  const [idx, setIdx] = useState(0);
  const outer = useRef(null);
  const rows = byMonth(month);

  useEffect(() => {
    const onScroll = () => {
      const el = outer.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = Math.min(0.9999, Math.max(0, -r.top / span));
      setIdx(Math.floor(p * 5));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const jump = (i) => {
    const el = outer.current;
    const span = el.offsetHeight - window.innerHeight;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + ((i + 0.5) / 5) * span, behavior: "smooth" });
  };

  return (
    <section className="step cards-step" id="cards">
      <div ref={outer} className="cards-outer">
        <div className="cards-sticky">
          <div className="step-inner">
            <header className="step-head">
              <h2>
                <Bi en="Family cards" zh="每月 top5 科名片" />
              </h2>
              <p className="sec-desc">
                Scroll to move through the five families of the chosen month, from rank 1 to rank 5. The chart on the left follows the card.
                <span className="zh">滚动切换科名片，左侧排名同步高亮。</span>
              </p>
            </header>
            <Tabs
              value={month}
              onChange={(m) => setMonth(m)}
              options={PEAK.map((m) => ({ value: m, label: `${MONTH_NAME[m].slice(0, 3)} ${m}月 (${byMonth(m)[0].monthTotal})` }))}
            />
            <div className="cards-body">
              <div className="panel cards-left">
                <div className="panel-label">
                  <Bi en={`${MONTH_NAME[month]} · top 5 families`} zh="排名" />
                </div>
                <RankBars month={month} active={idx} onPick={jump} />
                <p className="small">
                  Card {idx + 1} of 5 · n = {rows[0].monthTotal} edible records this month.
                </p>
              </div>
              <Card family={rows[idx].family} month={month} key={`${month}-${rows[idx].family}`} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { C };
