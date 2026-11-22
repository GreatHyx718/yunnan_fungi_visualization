import { useEffect, useMemo, useRef, useState } from "react";
import { geoPath } from "d3-geo";
import { C, counties, prefectures, records } from "../../utils/theme.js";
import { useTip } from "../../utils/ui.jsx";
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

export default function Amanita() {
  const tip = useTip();

  // Classify all species records
  const { allSpecies, poisonousSpecies, edibleToxicSpecies, edibleSpecies, otherSpecies } = useMemo(() => {
    const speciesSet = new Set();
    records.forEach(r => r.sp && speciesSet.add(r.sp));

    const allSpecies = Array.from(speciesSet);
    const poisonousSpecies = allSpecies.filter(sp => TOXIC_SPECIES[sp]?.type === "poisonous");
    const edMax = new Map();
    records.forEach(r => { if (r.sp) edMax.set(r.sp, Math.max(edMax.get(r.sp) || 0, r.ed || 0)); });
    const edibleToxicSpecies = allSpecies.filter(sp => TOXIC_SPECIES[sp]?.type === "edible-toxic" || (!TOXIC_SPECIES[sp] && edMax.get(sp) === 2));
    const edibleSpecies = allSpecies.filter(sp => !TOXIC_SPECIES[sp] && edMax.get(sp) === 1);
    const otherSpecies = allSpecies.filter(sp => !TOXIC_SPECIES[sp] && edMax.get(sp) !== 1 && edMax.get(sp) !== 2);

    return { allSpecies, poisonousSpecies, edibleToxicSpecies, edibleSpecies, otherSpecies };
  }, []);
  const toxicSet = useMemo(() => new Set([...poisonousSpecies, ...edibleToxicSpecies]), [poisonousSpecies, edibleToxicSpecies]);

  // Toxic records with coordinates, for the map and the elevation chart
  const toxicRecords = useMemo(
    () => records.filter(r => r.sp && toxicSet.has(r.sp) && r.lat != null && r.lon != null),
    [toxicSet],
  );

  // Elevation range holding the most toxic records
  const peakRange = useMemo(() => {
    const cells = Array(BINS.length - 1).fill(0);
    let n = 0;
    for (const r of toxicRecords) {
      if (r.el == null) continue;
      cells[Math.min(BINS.length - 2, Math.max(0, Math.floor(r.el / 500)))]++;
      n++;
    }
    const i = cells.indexOf(Math.max(...cells));
    return { lo: BINS[i], hi: BINS[i] + 500, share: n ? Math.round((cells[i] / n) * 100) : 0 };
  }, [toxicRecords]);

  const nToxic = poisonousSpecies.length + edibleToxicSpecies.length;

  const rowStyle = { alignItems: 'center' };
  const followRow = { alignItems: 'center', paddingTop: 0 };
  // Chart column scrolls with the page (no sticky stage)
  const plainStage = { position: 'relative', top: 0, height: 'auto', minHeight: 0, overflow: 'visible' };

  return (
    <>
      <section id="poisonous" className="story-section" style={rowStyle}>
        <div className="story-col">
          <header className="story-head">
            <h2>Poisonous Mushrooms in Yunnan</h2>
          </header>
          <div className="story-text">
            <p>
              The Yunnan records name {allSpecies.length} species. {nToxic} of them appear in China CDC mushroom
              poisoning reports from 2019 to 2025.
            </p>
            <p>
              Sort every species by what the reports and the edible-range literature say. {edibleSpecies.length} stay in
              the edible range, {poisonousSpecies.length} are poisonous, and {edibleToxicSpecies.length} are edible but
              also flagged as poisonous. The other {otherSpecies.length} match none of these groups.
            </p>
          </div>
        </div>
        <div className="story-stage" style={plainStage}>
          <FlowWithLists
            poisonousSpecies={poisonousSpecies}
            edibleToxicSpecies={edibleToxicSpecies}
            edibleCount={edibleSpecies.length}
            otherCount={otherSpecies.length}
          />
        </div>
      </section>

      <section className="story-section" style={followRow}>
        <div className="story-col">
          <div className="story-text" style={{ marginTop: 0 }}>
            <p>
              {toxicRecords.length} records of Poisonous and Edible-Poisonous species carry coordinates. Brown dots are
              Poisonous species, yellow dots are Edible-Poisonous ones. Each dot is one observation.
            </p>
          </div>
        </div>
        <div className="story-stage" style={plainStage}>
          <ToxicBubbleMap records={toxicRecords} tip={tip} />
        </div>
      </section>

      <section className="story-section" style={followRow}>
        <div className="story-col">
          <div className="story-text" style={{ marginTop: 0 }}>
            <p>
              {peakRange.share}% of these records with an elevation lie between {peakRange.lo} and {peakRange.hi} m.
            </p>
          </div>
        </div>
        <div className="story-stage" style={plainStage}>
          <ElevationHeatmap records={toxicRecords} />
        </div>
      </section>
    </>
  );
}

// Species scroll panel
function SpeciesPanel({ title, color, species }) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', border: '1px solid #d8d8d8', borderRadius: 6 }}>
      <div style={{ padding: '0.45rem 0.7rem', fontSize: '0.8rem', fontWeight: 600, color, borderBottom: '1px solid #e8e8e8', flexShrink: 0 }}>
        {title} ({species.length})
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: '0 0.7rem', overflowY: 'auto', flex: 1, minHeight: 0 }}>
        {species.map(sp => (
          <li key={sp} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <i style={{ fontSize: '0.75rem', color: C.text2 }}>{sp}</i>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Flow chart with the two species lists on its right; arrows point from the channels to the lists
function FlowWithLists({ poisonousSpecies, edibleToxicSpecies, edibleCount, otherCount }) {
  const ARROW_W = 56;
  const arrow = (y1, y2, color) => (
    <g key={color}>
      <line x1="0" y1={y1} x2={ARROW_W - 6} y2={y2} stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <path d={`M ${ARROW_W - 8} ${y2 - 3.5} L ${ARROW_W} ${y2} L ${ARROW_W - 8} ${y2 + 3.5} Z`} fill={color} />
    </g>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `minmax(0, 1fr) ${ARROW_W}px 220px`, alignItems: 'stretch' }}>
      <SankeyDiagram
        poisonousCount={poisonousSpecies.length}
        edibleToxicCount={edibleToxicSpecies.length}
        edibleCount={edibleCount}
        otherCount={otherCount}
      />
      <svg viewBox={`0 0 ${ARROW_W} 300`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {arrow(115, 75, COLORS.poisonous)}
        {arrow(185, 225, COLORS.edibleToxic)}
      </svg>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <SpeciesPanel title="Poisonous" color={COLORS.poisonous} species={poisonousSpecies} />
          <SpeciesPanel title="Edible-Poisonous" color={COLORS.edibleToxic} species={edibleToxicSpecies} />
        </div>
      </div>
    </div>
  );
}

// Particle flow: random cloud on the left funnels through a glowing centre line,
// then splits along Bezier-like curves into three bounded horizontal channels.
function SankeyDiagram({ poisonousCount, edibleToxicCount, edibleCount, otherCount }) {
  const canvasRef = useRef(null);
  const total = poisonousCount + edibleToxicCount + edibleCount + otherCount;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const W = 600, H = 300, CX = 300, CY = 150, L = 170, END = 495, HW = 14, BAND = 36;
    const channels = [
      { y: 45, color: [140, 157, 131], n: edibleCount, label: "Edible" },
      { y: 115, color: [160, 130, 109], n: poisonousCount, label: "Poisonous" },
      { y: 185, color: [196, 160, 88], n: edibleToxicCount, label: "Edible-Poisonous" },
      { y: 255, color: [136, 136, 136], n: otherCount, label: "Other" },
    ];
    const grey = [189, 189, 182];
    const smooth = (t) => { const c = Math.min(1, Math.max(0, t)); return c * c * (3 - 2 * c); };
    const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const pickChannel = () => {
      let r = Math.random() * total;
      for (const c of channels) { if ((r -= c.n) < 0) return c; }
      return channels[3];
    };

    let dpr = 1;
    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      canvas.width = w * dpr;
      canvas.height = (w * H / W) * dpr;
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
      const s = canvas.width / W;
      ctx.setTransform(s, 0, 0, s, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // channel boundaries
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

      // glowing centre line
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

      // spawn
      if (parts.length < 420 && Math.random() < 0.8) {
        const ch = pickChannel();
        parts.push({
          x: 0, y0: 20 + Math.random() * 260, vx: 0.8 + Math.random() * 0.6,
          ph: Math.random() * 6.28, amp: 2 + Math.random() * 4,
          ch, off: (Math.random() * 2 - 1) * (HW - 3),
        });
      }

      // particles
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx;
        if (p.x > END + 10) { parts.splice(i, 1); continue; }
        const m = smooth((p.x - CX) / 60);
        const col = mix(grey, p.ch.color, m);
        const fade = p.x > END - 25 ? Math.max(0, (END + 10 - p.x) / 35) : 1;
        ctx.fillStyle = `rgba(${col.join(",")},${0.85 * fade})`;
        ctx.beginPath();
        ctx.arc(p.x, yAt(p), 2.2, 0, 6.283);
        ctx.fill();
      }

      // labels
      ctx.textBaseline = "middle";
      for (const c of channels) {
        ctx.fillStyle = `rgb(${c.color.join(",")})`;
        ctx.font = "700 14px sans-serif";
        ctx.fillText(String(c.n), 505, c.y - 8);
        ctx.fillStyle = "#666";
        ctx.font = "10.5px sans-serif";
        ctx.fillText(c.label, 505, c.y + 8);
      }
      ctx.fillStyle = "#666";
      ctx.font = "600 11px sans-serif";
      ctx.fillText(`All species: ${total}`, 8, 12);

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [poisonousCount, edibleToxicCount, edibleCount, otherCount, total]);

  return (
    <div style={{ background: "transparent" }}>
      <canvas ref={canvasRef} style={{ width: "100%", aspectRatio: "2 / 1", display: "block" }} />
    </div>
  );
}

// Bubble map for toxic species
function ToxicBubbleMap({ records: toxicRecords, tip }) {
  return (
    <div style={{ padding: 0, background: 'transparent' }}>
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ width: '100%', maxHeight: '62vh' }}>
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

// Elevation heatmap
function ElevationHeatmap({ records: toxicRecords }) {
  const heat = useMemo(() => {
    const cells = Array(BINS.length - 1).fill(0);
    
    for (const r of toxicRecords) {
      if (r.el == null) continue;
      const binIndex = Math.min(BINS.length - 2, Math.max(0, Math.floor(r.el / 500)));
      cells[binIndex]++;
    }
    
    const max = Math.max(1, ...cells);
    return { cells, max };
  }, [toxicRecords]);

  return (
    <div style={{ padding: 0, background: 'transparent' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `80px repeat(${BINS.length - 1}, 1fr)`,
        gap: '6px',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>Elevation</span>
        {BINS.slice(0, -1).map((b, i) => (
          <span key={i} style={{ 
            fontSize: '0.75rem', 
            color: '#666',
            textAlign: 'center'
          }}>
            {b / 1000}k
          </span>
        ))}
        
        <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>Count</span>
        {heat.cells.map((v, i) => (
          <div
            key={i}
            style={{
              height: '70px',
              background: v ? `rgba(160,130,109,${0.2 + 0.7 * (v / heat.max)})` : "#f4f4f2",
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: v / heat.max > 0.55 ? "#fff" : C.text1,
              border: '1px solid #e8e8e8'
            }}
          >
            {v || ""}
          </div>
        ))}
      </div>
      <p style={{ 
        marginTop: '1.5rem', 
        fontSize: '0.75rem', 
        color: '#888',
        lineHeight: 1.6
      }}>
        Elevation bins of 500m. Shows combined distribution of poisonous and edible-toxic species.
      </p>
    </div>
  );
}
