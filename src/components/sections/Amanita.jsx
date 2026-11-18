import { useMemo, useState } from "react";
import { geoPath } from "d3-geo";
import { C, M, MONTH_ABBR, PEAK, prefectures, records } from "../../utils/theme.js";
import { Alert, Badge, Bi, Note, Seg, Step, Tag, useTip } from "../../utils/ui.jsx";
import { MAP_H, MAP_W, projection } from "./BubbleMap.jsx";

const path = geoPath(projection);
const STATUS = {
  1: { c: C.a400, en: "Edible range", zh: "可食范围" },
  2: { c: C.signal, en: "Edible but flagged poisonous", zh: "可食但被标有毒" },
  0: { c: M.slate, en: "Other / not in edible range", zh: "其他" },
};
const COMPARE = {
  none: null,
  Suillus: { color: M.sky },
  Russula: { color: M.gold },
};
const BINS = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000];

function genusStats(g) {
  const rs = records.filter((r) => r.ge === g);
  return {
    n: rs.length,
    species: new Set(rs.map((r) => r.sp).filter(Boolean)).size,
    coord: rs.filter((r) => r.lat != null).length,
    edible: rs.filter((r) => r.ed).length,
    months: PEAK.map((m) => rs.filter((r) => r.m === m).length),
  };
}

function GenusCard({ genus, zh }) {
  const s = useMemo(() => genusStats(genus), [genus]);
  const max = Math.max(...s.months, 1);
  return (
    <article className="card slim">
      <h3>
        <i>{genus}</i> <span className="zh">{zh}</span>
      </h3>
      <div className="stats3">
        <div><b>{s.n}</b><span>Records 记录</span></div>
        <div><b>{s.species}</b><span>Species 种数</span></div>
        <div><b>{s.edible}</b><span>Edible range 可食</span></div>
      </div>
      <div className="mini-bars">
        {s.months.map((v, i) => (
          <div key={i} className="mini-col">
            <span className="mini-n">{v}</span>
            <i style={{ height: `${(v / max) * 52 + (v ? 2 : 0)}px` }} />
            <span className="mini-m">{MONTH_ABBR[PEAK[i] - 1]}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function Amanita() {
  const tip = useTip();
  const [cmp, setCmp] = useState("none");
  const [cardGenus, setCardGenus] = useState("Suillus");
  const am = useMemo(() => records.filter((r) => r.ge === "Amanita" && r.lat != null), []);
  const other = useMemo(() => (cmp === "none" ? [] : records.filter((r) => r.ge === cmp && r.lat != null)), [cmp]);
  const spCount = useMemo(() => {
    const m = new Map();
    for (const r of records.filter((x) => x.ge === "Amanita")) {
      const k = r.sp || "Unidentified species";
      const o = m.get(k) || { n: 0, ed: 0 };
      o.n++;
      o.ed = Math.max(o.ed, r.ed);
      m.set(k, o);
    }
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n);
  }, []);

  // DEM heat grid: month rows (Jun-Sep) x elevation bins, Amanita records with coordinates.
  const heat = useMemo(() => {
    const cells = PEAK.map(() => Array(BINS.length - 1).fill(0));
    for (const r of am) {
      if (r.el == null || !PEAK.includes(r.m)) continue;
      const b = Math.min(BINS.length - 2, Math.max(0, Math.floor(r.el / 500)));
      cells[r.m - 6][b]++;
    }
    return { cells, max: Math.max(1, ...cells.flat()) };
  }, [am]);

  const totalAm = records.filter((r) => r.ge === "Amanita").length;
  const peakAm = records.filter((r) => r.ge === "Amanita" && PEAK.includes(r.m)).length;

  const pt = (r, extra) => {
    const [x, y] = projection([r.lon, r.lat]);
    return { x, y, r, ...extra };
  };

  return (
    <Step
      id="amanita"
      en="One genus, two kinds of mushroom: Amanita"
      zh="鹅膏属：同一属里既有可食种，也有致命种"
      desc={`Amanita has ${totalAm} records in ${spCount.filter(([k]) => k !== "Unidentified species").length} species, ${am.length} with coordinates and ${peakAm} in June–September. It includes edible species such as A. hemibapha and lethal ones such as A. pseudoporphyria, which is why observation does not mean edibility.`}
      descZh="同一属内既有可食种又有致命种。"
      wide
    >
      <div className="two-col wide-left">
        <div className="panel map-panel">
          <div className="panel-label row-between">
            <span>
              <Bi en="Symbol map" zh="符号地图" />
            </span>
            <Seg
              value={cmp}
              onChange={setCmp}
              options={[
                { value: "none", en: "Amanita", zh: "鹅膏属" },
                { value: "Suillus", en: "+ Suillus", zh: "对照" },
                { value: "Russula", en: "+ Russula", zh: "对照" },
              ]}
            />
          </div>
          <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="map" role="img" aria-label="Symbol map of Amanita records">
            {prefectures.features.map((f) => (
              <path key={f.properties.adcode} d={path(f)} fill={C.map} stroke="#fff" strokeWidth={1.2} />
            ))}
            {other.map((r, i) => {
              const p = pt(r);
              return (
                <rect
                  key={`o${i}`}
                  x={p.x - 4}
                  y={p.y - 4}
                  width={8}
                  height={8}
                  transform={`rotate(45 ${p.x} ${p.y})`}
                  fill="none"
                  stroke={COMPARE[cmp].color}
                  strokeWidth={2}
                  onMouseMove={(e) =>
                    tip.show(e, <><strong><i>{r.sp || cmp}</i></strong><div>{MONTH_ABBR[(r.m || 1) - 1]} {r.y}</div></>)
                  }
                  onMouseLeave={tip.hide}
                />
              );
            })}
            {am.map((r, i) => {
              const p = pt(r);
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={5}
                  fill={STATUS[r.ed].c}
                  fillOpacity={0.85}
                  stroke="#fff"
                  strokeWidth={1}
                  onMouseMove={(e) =>
                    tip.show(
                      e,
                      <>
                        <strong><i>{r.sp || "Amanita sp."}</i></strong>
                        <div>{STATUS[r.ed].en}</div>
                        <div>{r.m ? MONTH_ABBR[r.m - 1] : "month unknown"} {r.y}{r.el != null ? ` · ${Math.round(r.el)} m (DEM)` : ""}</div>
                      </>,
                    )
                  }
                  onMouseLeave={tip.hide}
                />
              );
            })}
          </svg>
          {tip.node}
          <div className="legend">
            {Object.values(STATUS).map((s) => (
              <span key={s.en}>
                <i className="sw-dot" style={{ background: s.c }} /> {s.en} <span className="zh">{s.zh}</span>
              </span>
            ))}
            {cmp !== "none" ? (
              <span>
                <i className="sw-dia" style={{ borderColor: COMPARE[cmp].color }} /> <i>{cmp}</i> ({other.length} points)
              </span>
            ) : null}
          </div>
        </div>
        <div className="side">
          <div className="panel">
            <div className="panel-label">
              <Bi en="Amanita species in the data" zh="鹅膏属的种" />
            </div>
            <ul className="sp-list">
              {spCount.map(([name, o]) => (
                <li key={name}>
                  <i className="sw-dot" style={{ background: STATUS[o.ed].c }} />
                  <i>{name}</i>
                  <b>{o.n}</b>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-label">
            <Bi en="Elevation × month, Amanita (records with coordinates)" zh="海拔热力图" /> <Badge kind="dem">DEM estimate ±200 m</Badge>
          </div>
          <div className="heat" style={{ gridTemplateColumns: `48px repeat(${BINS.length - 1}, 1fr)` }}>
            <span />
            {BINS.slice(0, -1).map((b) => (
              <span key={b} className="heat-h">
                {b / 1000}k
              </span>
            ))}
            {heat.cells.map((row, mi) => (
              <HeatRow key={mi} label={MONTH_ABBR[PEAK[mi] - 1]} row={row} max={heat.max} />
            ))}
          </div>
          <p className="small">Elevation bins of 500 m (in km, lower bound). DEM (SRTM 90 m) differs from the original elevation by more than 200 m for 36% of records that have both.</p>
        </div>
        <div className="panel">
          <div className="panel-label row-between">
            <span>
              <Bi en="Genus comparison" zh="属级名片对比" />
            </span>
            <Seg
              value={cardGenus}
              onChange={setCardGenus}
              options={[
                { value: "Suillus", en: "Suillus", zh: "乳牛肝菌属" },
                { value: "Boletus", en: "Boletus", zh: "牛肝菌属" },
              ]}
            />
          </div>
          <div className="cmp">
            <GenusCard genus="Amanita" zh="鹅膏属" />
            <GenusCard genus={cardGenus} zh={cardGenus === "Suillus" ? "乳牛肝菌属" : "牛肝菌属"} />
          </div>
        </div>
      </div>
      <Alert kind="danger">
        Within one genus, <i>A. hemibapha</i> and <i>A. ochracea</i> are in the edible range, while <i>A. pseudoporphyria</i> appears in China CDC outbreak tables every year from 2019 to 2025.
        <span className="zh">同一属内既有可食种，又有致命种。</span>
      </Alert>
      <Note>
        Jian shou qing (<i>Lanmaoa asiatica</i>, 见手青) also appears in CDC reports, but the local data hold only 1 record of it, too few for a map.
        <Tag kind="info">CDC species matching is incomplete</Tag> so statuses on this map come from the edible-range literature only.
      </Note>
    </Step>
  );
}

function HeatRow({ label, row, max }) {
  return (
    <>
      <span className="heat-l">{label}</span>
      {row.map((v, i) => (
        <span
          key={i}
          className="heat-c"
          style={{
            background: v ? `rgba(160,130,109,${0.2 + 0.7 * (v / max)})` : "#f4f4f2",
            color: v / max > 0.55 ? "#fff" : C.text1,
          }}
        >
          {v || ""}
        </span>
      ))}
    </>
  );
}
