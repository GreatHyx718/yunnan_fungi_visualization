import { useEffect, useMemo, useRef, useState } from "react";
import { geoPath } from "d3-geo";
import { C, MONTH_ABBR, prefectures, records } from "../../utils/theme.js";
import { Badge, useTip } from "../../utils/ui.jsx";
import { MAP_H, MAP_W, projection } from "./BubbleMap.jsx";
import "../../styles/storyLayout.css";

const pathGen = geoPath(projection);

// Poisonous species from CDC with their edibility status
const TOXIC_SPECIES = {
  // Poisonous (not edible)
  "Amanita pseudoporphyria": { type: "poisonous", clinical: "Acute renal failure" },
  "Amanita subglobosa": { type: "poisonous", clinical: "Psycho" },
  "Gymnopilus dilepis": { type: "poisonous", clinical: "Psycho" },
  "Amanita virgineoides": { type: "poisonous", clinical: "Psycho/Rhabdomyolysis" },
  "Amanita subfrostiana": { type: "poisonous", clinical: "Psycho" },
  "Hypholoma fasciculare": { type: "poisonous", clinical: "Gastroenteritis" },
  "Baorangia pseudocalopus": { type: "poisonous", clinical: "Gastroenteritis" },
  "Baorangia major": { type: "poisonous", clinical: "Gastroenteritis" },
  "Boletellus emodensis": { type: "poisonous", clinical: "Gastroenteritis" },
  "Boletellus indistinctus": { type: "poisonous", clinical: "Gastroenteritis" },
  "Coprinellus micaceus": { type: "poisonous", clinical: "Gastroenteritis" },
  "Gymnopus dryophilus": { type: "poisonous", clinical: "Gastroenteritis" },
  "Lanmaoa asiatica": { type: "poisonous", clinical: "Psycho" },
  "Rubroboletus sinicus": { type: "poisonous", clinical: "Gastroenteritis" },
  "Suillus granulatus": { type: "poisonous", clinical: "Gastroenteritis" },
  "Suillus pinetorum": { type: "poisonous", clinical: "Gastroenteritis" },
  "Trametes hirsuta": { type: "poisonous", clinical: "Unclassified" },
  "Amanita fritillaria": { type: "poisonous", clinical: "Unclassified" },
  "Suillus placidus": { type: "poisonous", clinical: "Gastroenteritis" },
  
  // Edible but poisonous (marked with E in CDC)
  "Butyriboletus roseoflavus": { type: "edible-toxic", clinical: "Psycho" },
  "Thelephora ganbajun": { type: "edible-toxic", clinical: "Unclassified" },
  "Amanita rubroflava": { type: "edible-toxic", clinical: "Unclassified" },
  "Coprinus comatus": { type: "edible-toxic", clinical: "Gastroenteritis" },
  "Lentinula edodes": { type: "edible-toxic", clinical: "Psycho" },
  "Amanita ochracea": { type: "edible-toxic", clinical: "Acute liver failure" },
  "Amanita princeps": { type: "edible-toxic", clinical: "Unclassified" },
  "Leucocoprinus cretaceus": { type: "edible-toxic", clinical: "Gastroenteritis/Psycho" },
  "Lactifluus tenuicystidiatus": { type: "edible-toxic", clinical: "Unclassified" },
  "Amanita sinensis": { type: "edible-toxic", clinical: "Gastroenteritis" },
  "Agaricus campestris": { type: "edible-toxic", clinical: "Unclassified" },
  "Retiboletus fuscus": { type: "edible-toxic", clinical: "Gastroenteritis" },
  "Russula sanguinea": { type: "edible-toxic", clinical: "Psycho" },
  "Neoboletus flavidus": { type: "edible-toxic", clinical: "Gastroenteritis" },
  "Phylloporus brunneiceps": { type: "edible-toxic", clinical: "Unclassified" }
};

const COLORS = {
  poisonous: "#A0826D",      // signal color for purely poisonous
  edibleToxic: "#C4A058",    // warning color for edible but toxic
  other: "#8C9D83"           // a400 for other species
};

const BINS = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000];

const HEAT_MONTHS = [6, 7, 8, 9, 10];
const byName = (a, b) => a.localeCompare(b);

export default function Amanita() {
  const tip = useTip();

  // Classify all species records
  const groups = useMemo(() => {
    const speciesSet = new Set();
    records.forEach((r) => r.sp && speciesSet.add(r.sp));
    const edMax = new Map();
    records.forEach((r) => { if (r.sp) edMax.set(r.sp, Math.max(edMax.get(r.sp) || 0, r.ed || 0)); });
    const all = Array.from(speciesSet);
    const poisonous = all.filter((sp) => TOXIC_SPECIES[sp]?.type === "poisonous");
    const edibleToxic = all.filter((sp) => TOXIC_SPECIES[sp]?.type === "edible-toxic" || (!TOXIC_SPECIES[sp] && edMax.get(sp) === 2));
    const edible = all.filter((sp) => !TOXIC_SPECIES[sp] && edMax.get(sp) === 1);
    const other = all.filter((sp) => !TOXIC_SPECIES[sp] && edMax.get(sp) !== 1 && edMax.get(sp) !== 2);
    return {
      poisonous: poisonous.sort(byName),
      edibleToxic: edibleToxic.sort(byName),
      edible: edible.sort(byName),
      other: other.sort(byName),
    };
  }, []);
  const toxicSet = useMemo(() => new Set([...groups.poisonous, ...groups.edibleToxic]), [groups]);

  // Records of Poisonous and Edible-Poisonous species with coordinates, for the map and heatmap
  const toxicRecords = useMemo(
    () => records.filter((r) => r.sp && toxicSet.has(r.sp) && r.lat != null && r.lon != null),
    [toxicSet],
  );

  return (
    <section id="poisonous" className="story-section" style={{ gridTemplateColumns: "1fr" }}>
      <header className="story-head">
        <h2>Poisonous Mushrooms in Yunnan</h2>
      </header>

      <div className="poison-flow">
        <FlowChart groups={groups} />
      </div>

      <div className="poison-lower">
        <div>
          <div className="panel-label">Records of Poisonous and Edible-Poisonous species</div>
          <ToxicBubbleMap records={toxicRecords} tip={tip} />
        </div>
        <div>
          <ElevationHeatmap records={toxicRecords} />
        </div>
      </div>
    </section>
  );
}

// Particle flow: a random cloud on the left is gathered into a wide channel, passes a glowing
// line, and splits into four horizontal channels. Hovering the dot at the end of a channel
// lists the species in that group.
function FlowChart({ groups }) {
  const canvasRef = useRef(null);
  const W = 780, H = 300, CX = 300, CY = 150, L = 240, END = 620, HW = 14, BAND = 36;
  const channels = useMemo(
    () => [
      { y: 45, color: [140, 157, 131], label: "Edible", names: groups.edible },
      { y: 115, color: [160, 130, 109], label: "Poisonous", names: groups.poisonous },
      { y: 185, color: [196, 160, 88], label: "Edible-Poisonous", names: groups.edibleToxic },
      { y: 255, color: [136, 136, 136], label: "Other", names: groups.other },
    ],
    [groups],
  );
  const total = channels.reduce((a, c) => a + c.names.length, 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const grey = [189, 189, 182];
    const smooth = (t) => { const c = Math.min(1, Math.max(0, t)); return c * c * (3 - 2 * c); };
    const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const pickChannel = () => {
      let r = Math.random() * total;
      for (const c of channels) { if ((r -= c.names.length) < 0) return c; }
      return channels[3];
    };
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientWidth * (H / W) * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const yAt = (p) => {
      if (p.x < CX) {
        const t = Math.min(1, p.x / (CX - 60));
        const k = 1 - 0.75 * smooth(t);
        return CY + (p.y0 - CY) * k + Math.sin(p.x * 0.03 + p.ph) * p.amp * (1 - 0.8 * t);
      }
      const yc = CY + (p.y0 - CY) * 0.25;
      const s = smooth((p.x - CX) / L);
      return yc + (p.ch.y + p.off - yc) * s + Math.sin(p.x * 0.05 + p.ph) * 0.8 * s;
    };

    const parts = [];
    let raf = 0;
    const frame = () => {
      const sc = canvas.width / W;
      ctx.setTransform(sc, 0, 0, sc, 0, 0);
      ctx.clearRect(0, 0, W, H);

      for (const c of channels) {
        for (const sign of [-1, 1]) {
          ctx.beginPath();
          for (let x = CX; x <= END; x += 5) {
            const t = smooth((x - CX) / L);
            const y0 = CY + sign * BAND;
            const y = y0 + (c.y + sign * HW - y0) * t;
            if (x === CX) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = `rgba(${c.color.join(",")},0.45)`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      const g = ctx.createLinearGradient(0, 20, 0, 280);
      g.addColorStop(0, "rgba(52,76,61,0)");
      g.addColorStop(0.5, "rgba(52,76,61,0.9)");
      g.addColorStop(1, "rgba(52,76,61,0)");
      ctx.save();
      ctx.shadowColor = "rgba(52,76,61,0.6)";
      ctx.shadowBlur = 10;
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(CX, 20);
      ctx.lineTo(CX, 280);
      ctx.stroke();
      ctx.restore();

      if (parts.length < 1000 && Math.random() < 0.9) {
        parts.push({
          x: 0, y0: 20 + Math.random() * 260, vx: 0.45 + Math.random() * 0.3,
          ph: Math.random() * 6.28, amp: 2 + Math.random() * 4,
          ch: pickChannel(), off: (Math.random() * 2 - 1) * (HW - 3),
        });
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx;
        if (p.x > END + 8) { parts.splice(i, 1); continue; }
        const col = mix(grey, p.ch.color, smooth((p.x - CX) / 60));
        const fade = p.x > END - 25 ? Math.max(0, (END + 8 - p.x) / 33) : 1;
        ctx.fillStyle = `rgba(${col.join(",")},${0.85 * fade})`;
        ctx.beginPath();
        ctx.arc(p.x, yAt(p), 2.2, 0, 6.283);
        ctx.fill();
      }

      ctx.textBaseline = "middle";
      for (const c of channels) {
        ctx.fillStyle = `rgb(${c.color.join(",")})`;
        ctx.font = "700 14px sans-serif";
        ctx.fillText(String(c.names.length), 646, c.y - 8);
        ctx.fillStyle = "#666";
        ctx.font = "10.5px sans-serif";
        ctx.fillText(c.label, 646, c.y + 8);
      }
      ctx.fillStyle = "#666";
      ctx.font = "600 11px sans-serif";
      ctx.fillText(`All species: ${total}`, 8, 12);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [channels, total]);

  return (
    <div className="flow-chart">
      <canvas ref={canvasRef} style={{ width: "100%", aspectRatio: `${W} / ${H}`, display: "block" }} />
      {channels.map((c, i) => (
        <div
          key={c.label}
          className={`flow-hit flow-hit--${i < 2 ? "down" : "up"}`}
          style={{ left: `${((END + 8) / W) * 100}%`, top: `${(c.y / H) * 100}%`, "--c": `rgb(${c.color.join(",")})` }}
        >
          <button type="button" className="flow-dot" aria-label={`${c.label}: ${c.names.length} species`} />
          <div className="flow-panel" style={{ maxHeight: i === 1 ? 200 : 240 }}>
            <div className="flow-panel__t">{c.label} ({c.names.length})</div>
            <ul>
              {c.names.map((n) => (
                <li key={n}><i>{n}</i></li>
              ))}
            </ul>
          </div>
        </div>
      ))}
      <p className="flow-hint">Hover a dot to list the species in each group</p>
    </div>
  );
}

// Bubble map for toxic species
function ToxicBubbleMap({ records: toxicRecords, tip }) {
  return (
    <div style={{ padding: 0, background: 'transparent' }}>
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ width: "100%", maxHeight: "46vh" }}>
        {prefectures.features.map((f) => (
          <path 
            key={f.properties.adcode} 
            d={pathGen(f)} 
            fill={C.map} 
            stroke="#fff" 
            strokeWidth={1.2} 
          />
        ))}
        
        {toxicRecords.map((r, i) => {
          const [x, y] = projection([r.lon, r.lat]);
          const color = TOXIC_SPECIES[r.sp]?.type === "poisonous" ? COLORS.poisonous : COLORS.edibleToxic;
          
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={4}
              fill={color}
              fillOpacity={0.7}
              stroke="#fff"
              strokeWidth={1}
              style={{ cursor: 'pointer' }}
              onMouseMove={(e) => tip.show(e,
                <>
                  <strong><i>{r.sp}</i></strong>
                  <div>{TOXIC_SPECIES[r.sp]?.clinical || "Unknown"}</div>
                  <div>{r.y}{r.el ? ` · ${Math.round(r.el)}m` : ''}</div>
                </>
              )}
              onMouseLeave={tip.hide}
            />
          );
        })}
      </svg>
      {tip.node}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', justifyContent: 'center', fontSize: '0.85rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <i className="sw-dot" style={{ background: COLORS.poisonous }} />
          Poisonous
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <i className="sw-dot" style={{ background: COLORS.edibleToxic }} />
          Edible-Poisonous
        </span>
      </div>
    </div>
  );
}

// Elevation x month grid for Poisonous and Edible-Poisonous records with coordinates
function ElevationHeatmap({ records: toxicRecords }) {
  const heat = useMemo(() => {
    const cells = HEAT_MONTHS.map(() => Array(BINS.length - 1).fill(0));
    for (const r of toxicRecords) {
      if (r.el == null || !HEAT_MONTHS.includes(r.m)) continue;
      const b = Math.min(BINS.length - 2, Math.max(0, Math.floor(r.el / 500)));
      cells[r.m - HEAT_MONTHS[0]][b]++;
    }
    return { cells, max: Math.max(1, ...cells.flat()) };
  }, [toxicRecords]);

  return (
    <div>
      <div className="panel-label">Elevation × month, Poisonous and Edible-Poisonous species (records with coordinates)</div>
      <Badge kind="dem">DEM estimate ±200 m</Badge>
      <div className="heat" style={{ gridTemplateColumns: `40px repeat(${BINS.length - 1}, 1fr)`, marginTop: "0.8rem" }}>
        <span />
        {BINS.slice(0, -1).map((b) => (
          <span key={b} className="heat-h">{b / 1000}k</span>
        ))}
        {heat.cells.map((row, mi) => (
          <HeatRow key={mi} label={MONTH_ABBR[HEAT_MONTHS[mi] - 1]} row={row} max={heat.max} />
        ))}
      </div>
    </div>
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
