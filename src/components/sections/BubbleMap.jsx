import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { C, counties, countyName, fmt, prefName, prefectures, records } from "../../utils/theme.js";
import { useTip } from "../../utils/ui.jsx";
import { toEnglishName } from "../../utils/placeName.js";
import "../../styles/storyLayout.css";

export const MAP_W = 640;
export const MAP_H = 600;
export const projection = geoMercator().fitExtent(
  [
    [10, 10],
    [MAP_W - 10, MAP_H - 10],
  ],
  prefectures,
);
export const pathGen = geoPath(projection);

export default function BubbleMap() {
  const tip = useTip();
  const stageRef = useRef(null);
  const svgRef = useRef(null);
  const [noteShift, setNoteShift] = useState(0);

  // The note is as wide as the map, but starts at the same x as the breadcrumb of the previous
  // page ("全部 (1,188)": 1.1rem inset + 0.45rem button padding from the stage edge).
  useLayoutEffect(() => {
    const measure = () => {
      if (!stageRef.current || !svgRef.current) return;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const dx = svgRef.current.getBoundingClientRect().left - stageRef.current.getBoundingClientRect().left;
      setNoteShift(dx - 1.55 * rem);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stageRef.current);
    ro.observe(svgRef.current);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, []);
  const { byCounty, withCoord } = useMemo(() => {
    const byCounty = new Map();
    let withCoord = 0;
    for (const r of records) {
      if (r.ct == null) continue;
      withCoord++;
      byCounty.set(r.ct, (byCounty.get(r.ct) || 0) + 1);
    }
    return { byCounty, withCoord };
  }, []);

  const bubbles = counties
    .filter((c) => byCounty.has(c.id))
    .map((c) => {
      const [x, y] = projection(c.center);
      return { ...c, x, y, n: byCounty.get(c.id) };
    })
    .sort((a, b) => b.n - a.n);
  const maxN = bubbles[0].n;
  const prefTotals = new Map();
  for (const b of bubbles) prefTotals.set(b.pref, (prefTotals.get(b.pref) || 0) + b.n);
  const [topPrefId, topPrefN] = [...prefTotals.entries()].sort((a, b) => b[1] - a[1])[0];
  const topPref = { en: prefName.get(topPrefId).en, n: topPrefN };
  const rad = (n) => Math.sqrt(n / maxN) * 34; // area proportional to count
  const noCoord = records.length - withCoord;

  // tight box around the map and its bubbles, so the note below lines up with the drawing
  const [[px0, py0], [px1, py1]] = pathGen.bounds(prefectures);
  const vx0 = Math.min(px0, ...bubbles.map((b) => b.x - rad(b.n))) - 4;
  const vy0 = Math.min(py0, ...bubbles.map((b) => b.y - rad(b.n))) - 4;
  const vx1 = Math.max(px1, ...bubbles.map((b) => b.x + rad(b.n))) + 4;
  const vy1 = Math.max(py1, ...bubbles.map((b) => b.y + rad(b.n))) + 4;

  return (
    <section id="map" className="story-section">
      <div className="story-col">
        <header className="story-head">
          <h2>Observations by location</h2>
        </header>
        <div className="story-text">
          <p>
            {topPref.en} holds {fmt(topPref.n)} of the {fmt(withCoord)} records with coordinates ({Math.round((topPref.n / withCoord) * 100)}%), and{" "}
            {toEnglishName(bubbles[0].name)} alone has {fmt(bubbles[0].n)}. Of the {bubbles.length} counties with records,{" "}
            {bubbles.filter((b) => b.n < 5).length} have fewer than five.
          </p>
          <p className="story-hint">(*) Hover a bubble for the county name and count.</p>
        </div>
      </div>

      <div className="story-stage" ref={stageRef}>
        <div className="bubble-wrap">
        <svg ref={svgRef} viewBox={`${vx0} ${vy0} ${vx1 - vx0} ${vy1 - vy0}`} style={{ aspectRatio: `${vx1 - vx0} / ${vy1 - vy0}` }} className="bubble-map" role="img" aria-label="Bubble map of observations per county">
          {prefectures.features.map((f) => (
            <path key={f.properties.adcode} d={pathGen(f)} fill={C.map} stroke="#fff" strokeWidth={1.2} />
          ))}
          {prefectures.features.map((f) => {
            const [x, y] = pathGen.centroid(f);
            const n = prefName.get(f.properties.adcode);
            return (
              <text key={f.properties.adcode} x={x} y={y} className="map-label" textAnchor="middle">
                {n.en}
              </text>
            );
          })}
          {bubbles.map((b) => (
            <circle
              key={b.id}
              cx={b.x}
              cy={b.y}
              r={rad(b.n)}
              fill={C.p400}
              fillOpacity={0.42}
              stroke={C.p400}
              strokeWidth={1.2}
              className="bubble"
              onMouseMove={(e) =>
                tip.show(
                  e,
                  <>
                    <strong>
                      {toEnglishName(b.name)} <span className="zh">{prefName.get(b.pref).en}</span>
                    </strong>
                    <div>{b.n} records</div>
                  </>,
                )
              }
              onMouseLeave={tip.hide}
            />
          ))}
          <g transform={`translate(${vx1 - 120},${vy1 - 78})`}>
            {[100, 25, 5].map((n) => (
              <g key={n}>
                <circle cx={30} cy={56 - rad(n)} r={rad(n)} fill="none" stroke={C.text3} strokeWidth={1} />
                <text x={30 + 44} y={56 - 2 * rad(n) + 8} className="map-label small">
                  {n}
                </text>
                <line x1={30} x2={30 + 38} y1={56 - 2 * rad(n)} y2={56 - 2 * rad(n)} stroke={C.text3} strokeWidth={0.5} />
              </g>
            ))}
          </g>
        </svg>
        <p className="story-note" style={{ marginLeft: -noteShift }}>
          <span>* The map shows only the {fmt(withCoord)} records that have coordinates; another {fmt(noCoord)} records with no coordinates are not shown.</span>
        </p>
        </div>
        {tip.node}
      </div>
    </section>
  );
}

export { countyName };
