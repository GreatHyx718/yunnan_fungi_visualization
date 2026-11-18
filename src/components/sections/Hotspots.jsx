import { useMemo, useState } from "react";
import { scaleSqrt } from "d3-scale";
import { geoPath } from "d3-geo";
import countyGeo from "../../data/counties.json";
import { C, MONTH_ABBR, PEAK, familyColor, prefName, prefectures, records } from "../../utils/theme.js";
import { Alert, Bi, Note, Seg, Step, useTip } from "../../utils/ui.jsx";
import { MAP_H, MAP_W, projection } from "./BubbleMap.jsx";

const path = geoPath(projection);

// The county file is wound the opposite way to what d3-geo expects, which makes
// every county fill the whole sphere. Reverse each ring once at load time.
const rev = (rings) => rings.map((r) => [...r].reverse());
const countyFeatures = countyGeo.features.map((f) => ({
  ...f,
  geometry:
    f.geometry.type === "Polygon"
      ? { ...f.geometry, coordinates: rev(f.geometry.coordinates) }
      : { ...f.geometry, coordinates: f.geometry.coordinates.map(rev) },
}));

export default function Hotspots() {
  const tip = useTip();
  const [rank, setRank] = useState("fa");
  const peak = useMemo(() => records.filter((r) => r.ct != null && PEAK.includes(r.m)), []);
  const { byCounty, byPref } = useMemo(() => {
    const byCounty = new Map();
    const byPref = new Map();
    for (const r of peak) {
      byCounty.set(r.ct, (byCounty.get(r.ct) || 0) + 1);
      byPref.set(r.pf, (byPref.get(r.pf) || 0) + 1);
    }
    return { byCounty, byPref };
  }, [peak]);
  const ranking = [...byPref.entries()].sort((a, b) => b[1] - a[1]);
  const [pref, setPref] = useState(ranking[0][0]);
  const maxC = Math.max(...byCounty.values());
  const color = scaleSqrt().domain([0, maxC]).range([0, 1]);
  const shade = (n) => {
    if (!n) return C.map;
    const t = color(n);
    // interpolate #d4e0d8 -> #344C3D
    const a = [212, 224, 216];
    const b = [52, 76, 61];
    return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
  };

  // Calendar for selected prefecture: all months, all records with coordinates.
  const calendar = useMemo(() => {
    const rs = records.filter((r) => r.pf === pref);
    const counts = new Map();
    let unid = 0;
    for (const r of rs) {
      const k = r[rank];
      if (!k) {
        unid++;
        continue;
      }
      if (!counts.has(k)) counts.set(k, { name: k, total: 0, m: Array(12).fill(0) });
      const o = counts.get(k);
      o.total++;
      if (r.m) o.m[r.m - 1]++;
    }
    const top = [...counts.values()].sort((a, b) => b.total - a.total).slice(0, 8);
    const maxCell = Math.max(1, ...top.flatMap((t) => t.m));
    return { n: rs.length, top, unid, maxCell, names: counts.size };
  }, [pref, rank]);

  return (
    <Step
      id="hotspots"
      en="Where the peak season is busiest"
      zh="高发地区与出菇日历"
      desc="Counties are shaded by records in June–September. Click a county to pick its prefecture; the calendar shows its top 8 families or genera by month."
      descZh="县级图按 6–9 月记录数着色；点击选择州市，右侧为科/属 Top 8 的出菇日历。"
      wide
    >
      <div className="two-col wide-left">
        <div className="panel map-panel">
          <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="map" role="img" aria-label="County choropleth of June to September records">
            {countyFeatures.map((f) => {
              const id = f.properties.adcode;
              const n = byCounty.get(id) || 0;
              const inPref = f.properties.prefecture_adcode === pref;
              return (
                <path
                  key={id}
                  d={path(f)}
                  fill={shade(n)}
                  stroke="#fff"
                  strokeWidth={0.5}
                  opacity={inPref ? 1 : 0.55}
                  className="click"
                  onClick={() => setPref(f.properties.prefecture_adcode)}
                  onMouseMove={(e) =>
                    tip.show(
                      e,
                      <>
                        <strong>{f.properties.name}</strong>
                        <span className="zh">{prefName.get(f.properties.prefecture_adcode).en}</span>
                        <div>{n} records in Jun–Sep</div>
                      </>,
                    )
                  }
                  onMouseLeave={tip.hide}
                />
              );
            })}
            {prefectures.features.map((f) => (
              <path
                key={f.properties.adcode}
                d={path(f)}
                fill="none"
                stroke={f.properties.adcode === pref ? C.signal : "#fff"}
                strokeWidth={f.properties.adcode === pref ? 2.4 : 1}
                pointerEvents="none"
              />
            ))}
          </svg>
          {tip.node}
          <div className="scale-bar">
            <span>0</span>
            <i style={{ background: `linear-gradient(90deg, ${shade(1)}, ${shade(maxC)})` }} />
            <span>{maxC} records</span>
          </div>
        </div>
        <div className="side">
          <div className="chips">
            {ranking.slice(0, 6).map(([id, n]) => (
              <button key={id} className={`chip-btn${id === pref ? " on" : ""}`} onClick={() => setPref(id)}>
                {prefName.get(id).en} <b>{n}</b>
              </button>
            ))}
          </div>
          <div className="panel">
            <div className="panel-label row-between">
              <span>
                <Bi en={`Fruiting calendar · ${prefName.get(pref).en}`} zh={`${prefName.get(pref).zh}出菇日历`} />
              </span>
              <Seg
                value={rank}
                onChange={setRank}
                options={[
                  { value: "fa", en: "Family", zh: "科" },
                  { value: "ge", en: "Genus", zh: "属" },
                ]}
              />
            </div>
            <div className="cal">
              <div className="cal-row cal-head">
                <span />
                {MONTH_ABBR.map((m, i) => (
                  <span key={m} className={PEAK.includes(i + 1) ? "peak" : ""}>
                    {m}
                  </span>
                ))}
                <span>n</span>
              </div>
              {calendar.top.map((t) => (
                <div className="cal-row" key={t.name}>
                  <span className="cal-name" title={t.name}>
                    {t.name}
                  </span>
                  {t.m.map((v, i) => (
                    <span
                      key={i}
                      className="cal-cell"
                      style={{
                        background: v ? `rgba(52,76,61,${0.15 + 0.75 * (v / calendar.maxCell)})` : "#f4f4f2",
                        color: v / calendar.maxCell > 0.5 ? "#fff" : C.text1,
                      }}
                    >
                      {v || ""}
                    </span>
                  ))}
                  <span className="cal-total">{t.total}</span>
                </div>
              ))}
            </div>
            <p className="small">
              {calendar.n} records with coordinates in this prefecture; {calendar.names} {rank === "fa" ? "families" : "genera"} named, {calendar.unid} not identified to that rank.
              Many cells are 1–2 records.
            </p>
          </div>
          <Alert kind="info">
            Poisoning data (CDC) exist only at province level and for a few prefectures, so there is no county-level poisoning layer here.
            <span className="zh">CDC 中毒数据仅有省级和少数州市。</span>
          </Alert>
        </div>
      </div>
      <Note>
        Species-level calendars would be too thin: Xishuangbanna has 83 Jun–Sep records spread over 44 species, mostly 1–2 each, so the calendar works at family or genus level.
        Observation counts reflect sampling effort, not true abundance.
      </Note>
    </Step>
  );
}

export { familyColor };
