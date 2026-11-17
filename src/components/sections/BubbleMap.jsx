import { useMemo } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { C, counties, countyName, fmt, prefName, prefectures, records } from "../../utils/theme.js";
import { Alert, Bi, Note, Step, useTip } from "../../utils/ui.jsx";

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
  const { byCounty, byPref, withCoord } = useMemo(() => {
    const byCounty = new Map();
    const byPref = new Map();
    let withCoord = 0;
    for (const r of records) {
      if (r.ct == null) continue;
      withCoord++;
      byCounty.set(r.ct, (byCounty.get(r.ct) || 0) + 1);
      byPref.set(r.pf, (byPref.get(r.pf) || 0) + 1);
    }
    return { byCounty, byPref, withCoord };
  }, []);

  const bubbles = counties
    .filter((c) => byCounty.has(c.id))
    .map((c) => {
      const [x, y] = projection(c.center);
      return { ...c, x, y, n: byCounty.get(c.id) };
    })
    .sort((a, b) => b.n - a.n);
  const maxN = bubbles[0].n;
  const rad = (n) => Math.sqrt(n / maxN) * 34; // area proportional to count
  const ranking = [...byPref.entries()].sort((a, b) => b[1] - a[1]);
  const maxPref = ranking[0][1];
  const sorted = [...byCounty.values()].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const noCoord = records.length - withCoord;

  return (
    <Step
      id="map"
      num="02"
      en="Observations by prefecture and county"
      zh="各州市观测数量"
      desc="Prefectures give the boundaries; each bubble sits on a county and its area is proportional to the number of records."
      descZh="气泡面积与记录数成正比。"
    >
      <div className="two-col">
        <div className="panel map-panel">
          <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="map" role="img" aria-label="Bubble map of observations per county">
            <rect width={MAP_W} height={MAP_H} fill="none" />
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
                        {b.name} <span className="zh">{prefName.get(b.pref).en}</span>
                      </strong>
                      <div>{b.n} records</div>
                    </>,
                  )
                }
                onMouseLeave={tip.hide}
              />
            ))}
            <g transform={`translate(${MAP_W - 130},${MAP_H - 70})`}>
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
          {tip.node}
        </div>
        <div className="side">
          <div className="panel">
            <div className="panel-label">
              <Bi en="Records per prefecture (with coordinates)" zh="各州市记录数" />
            </div>
            <ul className="bar-list">
              {ranking.map(([id, n]) => (
                <li key={id}>
                  <span className="bl-name">{prefName.get(id).en}</span>
                  <span className="bl-bar">
                    <i style={{ width: `${(n / maxPref) * 100}%` }} />
                  </span>
                  <span className="bl-n">{n}</span>
                </li>
              ))}
            </ul>
          </div>
          <Alert kind="warning">
            Yuxi ({byPref.get(530400)}), Lincang ({byPref.get(530900)}) and Nujiang ({byPref.get(533300)}) have very few records. This more likely reflects sampling effort than a lack of fungi.
            <span className="zh">观测 ≠ 实际分布。</span>
          </Alert>
        </div>
      </div>
      <Note>
        The map shows only the {fmt(withCoord)} records that have coordinates. Another {fmt(noCoord)} records have no coordinates and are not shown; 214 of them name a city and could be added to prefecture totals, but cannot be placed on a county.
        The largest county is {bubbles[0].name} ({bubbles[0].n}), followed by {bubbles[1].name} ({bubbles[1].n}); the median county has {median} records, so bubble radius uses a square-root scale.
        <span className="zh"> 另有 {noCoord} 条无坐标记录未显示。</span>
      </Note>
    </Step>
  );
}

export { countyName };
