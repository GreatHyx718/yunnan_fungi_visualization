import { useEffect, useMemo, useRef } from "react";
import { geoPath } from "d3-geo";
import { C, counties, prefectures, records } from "../../utils/theme.js";
import { useTip } from "../../utils/ui.jsx";
import { MAP_H, MAP_W, projection } from "./BubbleMap.jsx";

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
    const edibleToxicSpecies = allSpecies.filter(sp => TOXIC_SPECIES[sp]?.type === "edible-toxic");
    const edMax = new Map();
    records.forEach(r => { if (r.sp) edMax.set(r.sp, Math.max(edMax.get(r.sp) || 0, r.ed || 0)); });
    const edibleSpecies = allSpecies.filter(sp => !TOXIC_SPECIES[sp] && edMax.get(sp) === 1);
    const otherSpecies = allSpecies.filter(sp => !TOXIC_SPECIES[sp] && edMax.get(sp) !== 1);
    
    return { allSpecies, poisonousSpecies, edibleToxicSpecies, edibleSpecies, otherSpecies };
  }, []);

  // Get toxic records for map and elevation
  const toxicRecords = useMemo(() => {
    return records.filter(r => 
      r.sp && TOXIC_SPECIES[r.sp] && r.lat != null && r.lon != null
    );
  }, []);

  return (
    <section id="poisonous" style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '4rem 2rem',
      background: 'var(--bg-page)' 
    }}>
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: '2rem', 
          fontWeight: 800,
          color: 'var(--text-1)',
          marginBottom: '1rem'
        }}>
          Poisonous Mushrooms in Yunnan
        </h2>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--text-2)', maxWidth: '800px' }}>
          Based on China CDC reports from 2019-2025, {poisonousSpecies.length + edibleToxicSpecies.length} species have been linked to poisoning incidents. 
          Some are purely poisonous, while others are edible but can cause poisoning under certain conditions.
        </p>
      </header>

      {/* 2x2 Grid Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        marginTop: '2rem'
      }}>
        {/* (0,0) Sankey Flow Diagram */}
        <div style={{ gridColumn: '1', gridRow: '1' }}>
          <SankeyDiagram 
            poisonousCount={poisonousSpecies.length}
            edibleToxicCount={edibleToxicSpecies.length}
            edibleCount={edibleSpecies.length}
            otherCount={otherSpecies.length}
          />
        </div>

        {/* (0,1) Species List */}
        <div style={{ gridColumn: '2', gridRow: '1' }}>
          <SpeciesList 
            poisonousSpecies={poisonousSpecies}
            edibleToxicSpecies={edibleToxicSpecies}
          />
        </div>

        {/* (1,0) Bubble Map */}
        <div style={{ gridColumn: '1', gridRow: '2' }}>
          <ToxicBubbleMap records={toxicRecords} tip={tip} />
        </div>

        {/* (1,1) Elevation Heatmap */}
        <div style={{ gridColumn: '2', gridRow: '2' }}>
          <ElevationHeatmap records={toxicRecords} />
        </div>
      </div>
    </section>
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
    const W = 600, H = 300, CX = 300, CY = 150, L = 170, END = 515, HW = 14;
    const channels = [
      { y: 45, color: [140, 157, 131], n: edibleCount, label: "Edible" },
      { y: 115, color: [160, 130, 109], n: poisonousCount, label: "Poisonous" },
      { y: 185, color: [196, 160, 88], n: edibleToxicCount, label: "Edible but toxic" },
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
        const t = p.x / CX;
        const k = 1 - 0.65 * smooth(t);
        return CY + (p.y0 - CY) * k + Math.sin(p.x * 0.03 + p.ph) * p.amp * (1 - 0.7 * t);
      }
      const yc = CY + (p.y0 - CY) * 0.35;
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
            const y0 = CY + sign * 3;
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
        ctx.fillText(String(c.n), 528, c.y - 8);
        ctx.fillStyle = "#666";
        ctx.font = "11px sans-serif";
        ctx.fillText(c.label, 528, c.y + 8);
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
    <div style={{ height: "100%", padding: "1.5rem", background: "transparent" }}>
      <canvas ref={canvasRef} style={{ width: "100%", aspectRatio: "2 / 1", display: "block" }} />
    </div>
  );
}

// Species list with scroll panel
function SpeciesList({ poisonousSpecies, edibleToxicSpecies }) {
  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      padding: '1.5rem', 
      background: 'transparent',
      minHeight: 0
    }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: C.text1, flexShrink: 0 }}>
        Toxic Species
      </h3>
      <div style={{ 
        maxHeight: '350px', // Fixed max height to force scrolling
        overflowY: 'auto', 
        fontSize: '0.8rem',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '0.75rem',
        background: '#fff'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ 
            color: COLORS.poisonous, 
            fontSize: '0.85rem', 
            fontWeight: 600,
            marginBottom: '0.5rem',
            position: 'sticky',
            top: '-0.75rem',
            background: '#fff',
            paddingTop: '0.5rem',
            paddingBottom: '0.25rem',
            marginTop: '-0.5rem',
            zIndex: 1
          }}>
            Poisonous ({poisonousSpecies.length})
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {poisonousSpecies.map(sp => (
              <li key={sp} style={{ 
                padding: '0.35rem 0', 
                borderBottom: '1px solid #f5f5f5',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <span style={{ 
                  width: '5px', 
                  height: '5px', 
                  borderRadius: '50%', 
                  background: COLORS.poisonous,
                  flexShrink: 0
                }} />
                <i style={{ fontSize: '0.75rem', color: C.text2 }}>{sp}</i>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 style={{ 
            color: COLORS.edibleToxic, 
            fontSize: '0.85rem', 
            fontWeight: 600,
            marginBottom: '0.5rem',
            position: 'sticky',
            top: '-0.75rem',
            background: '#fff',
            paddingTop: '0.5rem',
            paddingBottom: '0.25rem',
            zIndex: 1
          }}>
            Edible but Toxic ({edibleToxicSpecies.length})
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {edibleToxicSpecies.map(sp => (
              <li key={sp} style={{ 
                padding: '0.35rem 0', 
                borderBottom: '1px solid #f5f5f5',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <span style={{ 
                  width: '5px', 
                  height: '5px', 
                  borderRadius: '50%', 
                  background: COLORS.edibleToxic,
                  flexShrink: 0
                }} />
                <i style={{ fontSize: '0.75rem', color: C.text2 }}>{sp}</i>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Bubble map for toxic species
function ToxicBubbleMap({ records: toxicRecords, tip }) {
  return (
    <div style={{ height: '100%', padding: '1.5rem', background: 'transparent' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: C.text1 }}>
        Geographic Distribution
      </h3>
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ width: '100%', height: 'auto' }}>
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
          Edible-Toxic
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
    <div style={{ height: '100%', padding: '1.5rem', background: 'transparent' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: C.text1 }}>
        Elevation Distribution
      </h3>
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
