import { scaleLinear } from "d3-scale";
import { line, area } from "d3-shape";
import { useMemo, useRef, useState, useEffect } from "react";
import { C, cdc } from "../../utils/theme.js";
import { useTip } from "../../utils/ui.jsx";
import "../../styles/storyLayout.css";

// Colors from design system
const COLORS = {
  deaths: "#4a4a4a",      // --n-700 深灰
  patients: "#888888"     // --n-500 浅灰
};

// Annual trends line chart component with scroll interaction
function AnnualTrendsChart({ isCumulative, tip }) {
  const data = useMemo(() => {
    const years = [2020, 2021, 2022, 2023, 2024, 2025];
    const result = years.map(y => {
      const cdcRow = cdc.annual.find(d => d.year === y) || { patients: 0, deaths: 0 };
      return {
        year: y,
        patients: cdcRow.patients,
        deaths: cdcRow.deaths
      };
    });
    return result;
  }, []);

  // Calculate cumulative data
  const cumulativeData = useMemo(() => {
    const cumulative = [];
    let cumPatients = 0;
    let cumDeaths = 0;
    
    data.forEach(d => {
      cumPatients += d.patients;
      cumDeaths += d.deaths;
      
      cumulative.push({
        year: d.year,
        patients: cumPatients,
        deaths: cumDeaths
      });
    });
    
    return cumulative;
  }, [data]);

  const currentData = isCumulative ? cumulativeData : data;

  const w = 720;
  const h = 460;
  const margin = { top: 30, right: 70, bottom: 80, left: 70 };
  const chartW = w - margin.left - margin.right;
  const chartH = h - margin.top - margin.bottom;

  const xScale = scaleLinear()
    .domain([2020, 2025])
    .range([0, chartW]);

  // Left Y axis for patients - use a tighter domain to spread out the line
  const yScalePatients = scaleLinear()
    .domain([0, Math.max(...currentData.map(d => d.patients)) * 1.1])
    .range([chartH, 0]);

  // Right Y axis for deaths - use a much larger multiplier to spread out the line
  const yScaleDeaths = scaleLinear()
    .domain([0, Math.max(...currentData.map(d => d.deaths)) * 1.3])
    .range([chartH, 0]);

  const lineGenPatients = line()
    .x(d => xScale(d.year))
    .y(d => yScalePatients(d.patients));

  const lineGenDeaths = line()
    .x(d => xScale(d.year))
    .y(d => yScaleDeaths(d.deaths));

  const areaGenPatients = area()
    .x(d => xScale(d.year))
    .y0(chartH)
    .y1(d => yScalePatients(d.patients));

  const areaGenDeaths = area()
    .x(d => xScale(d.year))
    .y0(chartH)
    .y1(d => yScaleDeaths(d.deaths));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ maxWidth: "100%", height: "auto" }}>
      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <line
            key={t}
            x1={0}
            y1={chartH * t}
            x2={chartW}
            y2={chartH * t}
            stroke="#e0e0e0"
            strokeWidth={1}
          />
        ))}

        {/* X axis */}
        <line x1={0} y1={chartH} x2={chartW} y2={chartH} stroke="#333" strokeWidth={2} />
        {data.map(d => (
          <g key={d.year} transform={`translate(${xScale(d.year)},${chartH})`}>
            <line y2={6} stroke="#333" strokeWidth={2} />
            <text y={24} textAnchor="middle" fill="#333" fontSize={14} fontWeight={600}>{d.year}</text>
          </g>
        ))}

        {/* Left Y axis (Patients) */}
        <line x1={0} y1={0} x2={0} y2={chartH} stroke="#333" strokeWidth={2} />
        {yScalePatients.ticks(5).map(t => (
          <g key={t}>
            <text x={-12} y={yScalePatients(t)} dy="0.35em" textAnchor="end" fontSize={12} fill="#666">
              {t}
            </text>
          </g>
        ))}
        <text
          transform={`translate(-55,${chartH / 2}) rotate(-90)`}
          textAnchor="middle"
          fill={COLORS.patients}
          fontSize={13}
          fontWeight={600}
        >
          {isCumulative ? "Cumulative Patients" : "Poisoning Patients"}
        </text>

        {/* Right Y axis (Deaths) */}
        <line x1={chartW} y1={0} x2={chartW} y2={chartH} stroke="#333" strokeWidth={2} />
        {yScaleDeaths.ticks(5).map(t => (
          <g key={t}>
            <text x={chartW + 12} y={yScaleDeaths(t)} dy="0.35em" textAnchor="start" fontSize={12} fill="#666">
              {t}
            </text>
          </g>
        ))}
        <text
          transform={`translate(${chartW + 55},${chartH / 2}) rotate(90)`}
          textAnchor="middle"
          fill={COLORS.deaths}
          fontSize={13}
          fontWeight={600}
        >
          {isCumulative ? "Cumulative Deaths" : "Deaths"}
        </text>

        {/* Area fills for cumulative view */}
        {isCumulative && (
          <>
            <path
              d={areaGenPatients(currentData)}
              fill={COLORS.patients}
              fillOpacity={0.2}
            />
            <path
              d={areaGenDeaths(currentData)}
              fill={COLORS.deaths}
              fillOpacity={0.2}
            />
          </>
        )}

        {/* Lines */}
        <path
          d={lineGenPatients(currentData)}
          fill="none"
          stroke={COLORS.patients}
          strokeWidth={3}
        />
        <path
          d={lineGenDeaths(currentData)}
          fill="none"
          stroke={COLORS.deaths}
          strokeWidth={3}
          strokeDasharray="6,4"
        />

        {/* Data points with tooltips */}
        {currentData.map(d => (
          <g key={`pts-${d.year}`}>
            <circle 
              cx={xScale(d.year)} 
              cy={yScalePatients(d.patients)} 
              r={6}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseMove={(e) => tip.show(e, 
                <>
                  <strong>{d.year}</strong>
                  <div>Poisoning Patients: {d.patients}</div>
                </>
              )}
              onMouseLeave={tip.hide}
            />
            <circle cx={xScale(d.year)} cy={yScalePatients(d.patients)} r={4} fill={COLORS.patients} stroke="#fff" strokeWidth={2} pointerEvents="none" />
            
            <circle 
              cx={xScale(d.year)} 
              cy={yScaleDeaths(d.deaths)} 
              r={6}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseMove={(e) => tip.show(e, 
                <>
                  <strong>{d.year}</strong>
                  <div>Deaths: {d.deaths}</div>
                </>
              )}
              onMouseLeave={tip.hide}
            />
            <circle cx={xScale(d.year)} cy={yScaleDeaths(d.deaths)} r={4} fill={COLORS.deaths} stroke="#fff" strokeWidth={2} pointerEvents="none" />
          </g>
        ))}

        {/* Legend below chart on the right side */}
        <g transform={`translate(${chartW - 200},${chartH + 52})`}>
          <g transform="translate(0,0)">
            <line x1={0} y1={0} x2={30} y2={0} stroke={COLORS.patients} strokeWidth={2.5} />
            <circle cx={15} cy={0} r={3.5} fill={COLORS.patients} stroke="#fff" strokeWidth={1.5} />
            <text x={36} y={4} fontSize={12} fill="#333">Poisoning Patients</text>
          </g>
          <g transform="translate(0,24)">
            <line x1={0} y1={0} x2={30} y2={0} stroke={COLORS.deaths} strokeWidth={2.5} strokeDasharray="6,4" />
            <circle cx={15} cy={0} r={3.5} fill={COLORS.deaths} stroke="#fff" strokeWidth={1.5} />
            <text x={36} y={4} fontSize={12} fill="#333">Deaths</text>
          </g>
        </g>
      </g>
    </svg>
  );
}

export default function Poison() {
  const tip = useTip();
  const stepRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;

      let newIndex = 0;
      stepRefs.current.forEach((ref, i) => {
        if (!ref) return;
        const rect = ref.getBoundingClientRect();
        const top = rect.top + scrollY;
        if (scrollY + windowHeight * 0.5 >= top) {
          newIndex = i;
        }
      });

      setActiveIndex(newIndex);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section id="poisoning" className="story-section">
      <div className="story-col story-col--blocks">
        <div
          ref={(el) => (stepRefs.current[0] = el)}
          className={`story-block${activeIndex === 0 ? " is-active" : ""}`}
        >
          <header className="story-head">
            <h2>Poisoning in Yunnan</h2>
          </header>
          <p>
            From 2020 to 2025, Yunnan Province reported 1,615 mushroom poisoning patients and 23 deaths according to China CDC, with most incidents occurring during the rainy season from June to October.
          </p>
        </div>

        <div
          ref={(el) => (stepRefs.current[1] = el)}
          className={`story-block${activeIndex === 1 ? " is-active" : ""}`}
        >
          <p>
            The cumulative view shows steady growth over the six-year period. While fatalities remain relatively low, the consistent rise in poisoning cases underscores the ongoing public health challenge.
          </p>
        </div>
      </div>

      <div className="story-stage">
        <div className="month-stage" style={{ height: '100%' }}>
          <div className="month-chart">
            <AnnualTrendsChart isCumulative={activeIndex === 1} tip={tip} />
          </div>
        </div>
        {tip.node}
      </div>
    </section>
  );
}
