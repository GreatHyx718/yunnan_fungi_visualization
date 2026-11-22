import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { scaleSqrt } from "d3-scale";
import { geoPath } from "d3-geo";
import { pinyin } from "pinyin-pro";
import countyGeo from "../../data/counties.json";
import { C, MONTH_ABBR, counties, prefName, prefectures, records } from "../../utils/theme.js";
import { projection, pathGen } from "./BubbleMap.jsx";
import "../../styles/storyLayout.css";

const PEAK_MONTHS = [6, 7, 8, 9, 10]; // June to October

// Convert Chinese county name to English (pinyin with proper capitalization)
const toEnglishName = (chineseName) => {
  // Remove common suffixes like 县, 区, 市
  const cleanName = chineseName.replace(/[县区市]/g, '');
  // Convert to pinyin with first letter capitalized
  const pinyinArray = pinyin(cleanName, { 
    toneType: 'none',
    type: 'array'
  });
  // Capitalize first letter of each word
  return pinyinArray.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
};

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
  const stageRef = useRef(null);
  const svgRef = useRef(null);
  const [hoveredBubble, setHoveredBubble] = useState(null);
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0, placement: "right" });
  
  const peak = useMemo(() => records.filter((r) => r.ct != null && PEAK_MONTHS.includes(r.m)), []);
  const { byCounty, byCountyMonth } = useMemo(() => {
    const byCounty = new Map();
    const byCountyMonth = new Map();
    for (const r of peak) {
      // Total count
      byCounty.set(r.ct, (byCounty.get(r.ct) || 0) + 1);
      // By month
      const key = `${r.ct}-${r.m}`;
      byCountyMonth.set(key, (byCountyMonth.get(key) || 0) + 1);
    }
    return { byCounty, byCountyMonth };
  }, [peak]);
  
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

  // Create bubbles for counties with data
  const bubbles = counties
    .filter((c) => byCounty.has(c.id))
    .map((c) => {
      const [x, y] = projection(c.center);
      return { ...c, x, y, n: byCounty.get(c.id) };
    })
    .sort((a, b) => b.n - a.n);
  
  const maxN = bubbles[0]?.n || 1;
  const rad = (n) => Math.sqrt(n / maxN) * 34; // area proportional to count

  // tight box around the map and its bubbles
  const [[px0, py0], [px1, py1]] = pathGen.bounds(prefectures);
  const vx0 = Math.min(px0, ...bubbles.map((b) => b.x - rad(b.n))) - 4;
  const vy0 = Math.min(py0, ...bubbles.map((b) => b.y - rad(b.n))) - 4;
  const vx1 = Math.max(px1, ...bubbles.map((b) => b.x + rad(b.n))) + 4;
  const vy1 = Math.max(py1, ...bubbles.map((b) => b.y + rad(b.n))) + 4;

  // Get county feature by ID
  const getCountyFeature = (id) => countyFeatures.find((f) => f.properties.adcode === id);

  // Get monthly breakdown for a county
  const getMonthlyBreakdown = (countyId) => {
    return PEAK_MONTHS.map((m) => {
      const key = `${countyId}-${m}`;
      return byCountyMonth.get(key) || 0;
    });
  };

  // Handle hover with smart positioning
  const handleBubbleHover = (e, bubble) => {
    setHoveredBubble(bubble);
    
    if (!stageRef.current || !svgRef.current) return;
    
    const stageRect = stageRef.current.getBoundingClientRect();
    const svgRect = svgRef.current.getBoundingClientRect();
    
    // Get bubble position in viewport
    const bubbleScreenX = e.clientX;
    const bubbleScreenY = e.clientY;
    
    // Convert to stage-relative coordinates
    const x = bubbleScreenX - stageRect.left;
    const y = bubbleScreenY - stageRect.top;
    
    const panelWidth = 280;
    const panelHeight = 240;
    const margin = 20;
    
    // Smart positioning: choose side based on available space
    const spaceRight = stageRect.right - bubbleScreenX;
    const spaceLeft = bubbleScreenX - stageRect.left;
    
    let placement = "right";
    let finalX = x + margin;
    let finalY = y - panelHeight / 2;
    
    // If not enough space on the right, try left
    if (spaceRight < panelWidth + margin + 50 && spaceLeft > spaceRight) {
      placement = "left";
      finalX = x - panelWidth - margin;
    }
    
    // Adjust vertical position if panel would go off screen
    if (finalY < 0) {
      finalY = 10;
    } else if (finalY + panelHeight > stageRect.height) {
      finalY = stageRect.height - panelHeight - 10;
    }
    
    setPanelPos({ x: finalX, y: finalY, placement });
  };

  const handleBubbleLeave = () => {
    setHoveredBubble(null);
  };

  // Create zoomed view for hovered county - rendered via Portal to avoid overflow clipping
  const renderZoomPanel = () => {
    if (!hoveredBubble || !stageRef.current) return null;
    
    const countyFeature = getCountyFeature(hoveredBubble.id);
    if (!countyFeature) return null;

    const monthlyData = getMonthlyBreakdown(hoveredBubble.id);

    // Calculate bounds for the zoomed county
    const bounds = pathGen.bounds(countyFeature);
    const [[x0, y0], [x1, y1]] = bounds;
    const width = x1 - x0;
    const height = y1 - y0;
    const padding = Math.max(width, height) * 0.3;
    
    const zoomVx0 = x0 - padding;
    const zoomVy0 = y0 - padding;
    const zoomVx1 = x1 + padding;
    const zoomVy1 = y1 + padding;
    const zoomW = zoomVx1 - zoomVx0;
    const zoomH = zoomVy1 - zoomVy0;
    
    // Use viewport coordinates for portal positioning
    const stageRect = stageRef.current.getBoundingClientRect();
    const finalX = stageRect.left + panelPos.x;
    const finalY = stageRect.top + panelPos.y;
    
    const panel = (
      <div
        style={{
          position: "fixed",
          left: `${finalX}px`,
          top: `${finalY}px`,
          width: "280px",
          background: "var(--bg-surface)",
          border: "2px solid var(--p-400)",
          borderRadius: "var(--r-md)",
          padding: "0.8rem",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          pointerEvents: "none",
          zIndex: 100,
        }}
      >
        <div style={{ marginBottom: "0.6rem" }}>
          <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-1)" }}>
            {toEnglishName(hoveredBubble.name)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: "0.15rem" }}>
            {prefName.get(hoveredBubble.pref).en}
          </div>
        </div>
        
        <svg
          viewBox={`${zoomVx0} ${zoomVy0} ${zoomW} ${zoomH}`}
          style={{
            width: "100%",
            height: "120px",
            display: "block",
            marginBottom: "0.6rem",
          }}
        >
          {/* Background counties */}
          {countyFeatures
            .filter((f) => {
              const [cx, cy] = pathGen.centroid(f);
              return cx >= zoomVx0 && cx <= zoomVx1 && cy >= zoomVy0 && cy <= zoomVy1;
            })
            .map((f) => {
              const id = f.properties.adcode;
              const n = byCounty.get(id) || 0;
              return (
                <path
                  key={id}
                  d={pathGen(f)}
                  fill={shade(n)}
                  stroke="#fff"
                  strokeWidth={1}
                  opacity={id === hoveredBubble.id ? 1 : 0.3}
                />
              );
            })}
          
          {/* Highlighted county border */}
          <path
            d={pathGen(countyFeature)}
            fill="none"
            stroke="var(--signal)"
            strokeWidth={3}
          />
        </svg>
        
        <div style={{ 
          fontSize: "1.1rem", 
          fontWeight: 700, 
          color: "var(--p-400)",
          fontFamily: "var(--font-display)",
          marginBottom: "0.4rem"
        }}>
          {hoveredBubble.n} records
        </div>
        
        <div style={{ 
          display: "flex",
          flexWrap: "wrap",
          gap: "0.4rem 0.6rem",
          fontSize: "0.72rem",
          color: "var(--text-2)"
        }}>
          {PEAK_MONTHS.map((m, i) => (
            <span key={m}>
              {MONTH_ABBR[m - 1]}: <b>{monthlyData[i]}</b>
            </span>
          ))}
        </div>
      </div>
    );
    
    // Render to document.body using Portal
    return createPortal(panel, document.body);
  };

  return (
    <>
      <section id="hotspots" className="story-section">
        <div className="story-col">
          <header className="story-head">
            <h2>Where the peak season is busiest</h2>
          </header>
          <div className="story-text">
            <p>Counties are shaded by records in June–October.</p>
            <p>Hover over a bubble to see details.</p>
          </div>
        </div>

        <div className="story-stage" ref={stageRef}>
          <div className="bubble-wrap">
            <svg 
              ref={svgRef}
              viewBox={`${vx0} ${vy0} ${vx1 - vx0} ${vy1 - vy0}`} 
              style={{ aspectRatio: `${vx1 - vx0} / ${vy1 - vy0}` }} 
              className="bubble-map" 
              role="img" 
              aria-label="Bubble map of June to October observations by county"
            >
              {/* County shapes with shading */}
              {countyFeatures.map((f) => {
                const id = f.properties.adcode;
                const n = byCounty.get(id) || 0;
                return (
                  <path
                    key={id}
                    d={pathGen(f)}
                    fill={shade(n)}
                    stroke="#fff"
                    strokeWidth={0.5}
                  />
                );
              })}
              
              {/* Prefecture borders */}
              {prefectures.features.map((f) => (
                <path
                  key={f.properties.adcode}
                  d={pathGen(f)}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={1.2}
                  pointerEvents="none"
                />
              ))}
              
              {/* Prefecture labels */}
              {prefectures.features.map((f) => {
                const [x, y] = pathGen.centroid(f);
                const n = prefName.get(f.properties.adcode);
                return (
                  <text key={f.properties.adcode} x={x} y={y} className="map-label" textAnchor="middle">
                    {n.en}
                  </text>
                );
              })}
              
              {/* Bubbles for counties */}
              {bubbles.map((b) => {
                const isHovered = hoveredBubble?.id === b.id;
                return (
                  <circle
                    key={b.id}
                    cx={b.x}
                    cy={b.y}
                    r={rad(b.n)}
                    fill="var(--p-400)"
                    fillOpacity={isHovered ? 0.7 : 0.42}
                    stroke="var(--p-400)"
                    strokeWidth={isHovered ? 2 : 1.2}
                    className="bubble"
                    style={{ transition: "fill-opacity 0.15s ease, stroke-width 0.15s ease" }}
                    onMouseMove={(e) => handleBubbleHover(e, b)}
                    onMouseLeave={handleBubbleLeave}
                  />
                );
              })}
            </svg>
          </div>
        </div>
      </section>
      {renderZoomPanel()}
    </>
  );
}

export { C as familyColor };
