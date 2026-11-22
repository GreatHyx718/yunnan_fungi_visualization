import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import { OTHER_COLOR, records } from "../../utils/theme.js";
import { useTip } from "../../utils/ui.jsx";
import "../../styles/storyLayout.css";

const W = 880;
const H = 560;
const MONTHS = [6, 7, 8, 9, 10];
const MONTH_LABELS = ["Jun", "Jul", "Aug", "Sep", "Oct"];
const MONTH_NAMES = ["June", "July", "August", "September", "October"];
const UNID = "Unidentified";
const OTHER = "Other families";

function monthTree(m) {
  const rs = records.filter((r) => r.m === m);
  const by = new Map();
  for (const r of rs) {
    const name = r.fa || UNID;
    const item = by.get(name) || { name, n: 0, flagged: 0 };
    item.n++;
    if (r.ed === 2) item.flagged++;
    by.set(name, item);
  }

  const all = [...by.values()].sort((a, b) => b.n - a.n);
  const keep = [];
  const other = { name: OTHER, n: 0, flagged: 0, parts: 0 };
  for (const item of all) {
    if (item.name === UNID || item.n / rs.length >= 0.03 || item.flagged > 0) keep.push(item);
    else {
      other.n += item.n;
      other.parts++;
    }
  }
  if (other.n) keep.push(other);
  return { n: rs.length, leaves: keep, counts: by };
}

function layout(tree) {
  const root = hierarchy({ children: tree.leaves }).sum((d) => d.n || 0);
  treemap().tile(treemapSquarify).size([W, H]).paddingInner(3)(root);
  return root.leaves();
}

// Greens from the design system (primary and sage scales), alternating dark and light so
// neighbouring tiles stay apart. Each family keeps one colour in every month, by overall rank.
const GREENS = ["#344C3D", "#c1d0b8", "#717e69", "#d4e0d8", "#5a7a5c", "#a8c1b1", "#8C9D83", "#565f50"];
const familyRank = (() => {
  const n = new Map();
  for (const r of records) if (r.fa) n.set(r.fa, (n.get(r.fa) || 0) + 1);
  return new Map([...n.entries()].sort((a, b) => b[1] - a[1]).map(([name], i) => [name, i]));
})();

function treemapColor(name) {
  return GREENS[(familyRank.get(name) ?? 0) % GREENS.length];
}

// white text on dark tiles, dark text on light ones
function textOn(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.3 ? "#2c2c2c" : "#ffffff";
}

export default function Treemaps() {
  const [activeIndex, setActiveIndex] = useState(0);
  const stepRefs = useRef([]);
  const stageRef = useRef(null);
  const chartRef = useRef(null);
  // Offsets (px) that line the text up with the chart's top-left corner: the first block starts
  // at the chart's top edge, and the last block ends level with it when the sticky stage is released.
  const [align, setAlign] = useState({ top: null, bottom: null });
  const tip = useTip();
  const months = useMemo(
    () => MONTHS.map((m) => {
      const tree = monthTree(m);
      return { m, tree, leaves: layout(tree) };
    }),
    [],
  );

  useLayoutEffect(() => {
    const measure = () => {
      const stage = stageRef.current;
      const chart = chartRef.current;
      const last = stepRefs.current[MONTHS.length - 1];
      if (!stage || !chart || !last || window.innerWidth <= 900) {
        setAlign({ top: null, bottom: null });
        return;
      }
      const top = chart.getBoundingClientRect().top - stage.getBoundingClientRect().top;
      const bottom = Math.max(0, stage.offsetHeight - top - last.offsetHeight);
      setAlign((a) => (Math.abs((a.top ?? -1) - top) < 0.5 && Math.abs((a.bottom ?? -1) - bottom) < 0.5 ? a : { top, bottom }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stageRef.current);
    ro.observe(chartRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      let next = 0;
      stepRefs.current.forEach((el, index) => {
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.55) next = index;
      });
      setActiveIndex(next);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const { tree, leaves } = months[activeIndex];
  const comparisonCount = (name, month) => {
    if (name === OTHER) return month.tree.leaves.find((item) => item.name === OTHER)?.n || 0;
    return month.tree.counts.get(name)?.n || 0;
  };

  return (
    <section id="composition" className="story-section treemap-story">
      <div className="story-col story-col--blocks">
        <div
          className={`story-block story-block--intro${activeIndex === 0 ? " is-active" : ""}`}
          style={align.top == null ? undefined : { marginTop: align.top, transform: "none" }}
        >
          <header className="story-head">
            <h2>What was recorded each month</h2>
          </header>
          <p>The treemap is grouped by family. Tile area is the share of that month&apos;s records. Tiles marked ▲ contain records of species the literature also lists as poisonous.</p>
        </div>
        <div
          ref={(el) => (stepRefs.current[0] = el)}
          className={`story-block story-block--month story-block--month-first${activeIndex === 0 ? " is-active" : ""}`}
        >
          <p className="story-month">June</p>
        </div>
        {MONTHS.slice(1).map((month, index) => (
          <div
            key={month}
            ref={(el) => (stepRefs.current[index + 1] = el)}
            className={`story-block story-block--month${activeIndex === index + 1 ? " is-active" : ""}`}
            style={index === MONTHS.length - 2 && align.bottom != null ? { marginBottom: align.bottom } : undefined}
          >
            <p className="story-month">{MONTH_NAMES[index + 1]}</p>
          </div>
        ))}
      </div>

      <div className="story-stage treemap-stage" ref={stageRef}>
        <div className="treemap-chart">
          <svg ref={chartRef} viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`Treemap of families in ${MONTH_LABELS[activeIndex]}`}>
            {leaves.map((leaf) => {
              const item = leaf.data;
              const width = leaf.x1 - leaf.x0;
              const height = leaf.y1 - leaf.y0;
              const color = item.name === UNID ? "#d9d9d4" : item.name === OTHER ? OTHER_COLOR : treemapColor(item.name);
              const label = item.name === OTHER ? `Other (${item.parts})` : item.name;
              return (
                <g
                  key={item.name}
                  transform={`translate(${leaf.x0},${leaf.y0})`}
                  className="tile"
                  onMouseMove={(event) =>
                    tip.show(
                      event,
                      <>
                        <strong>{item.name}</strong>
                        <div>{item.n} records, {((item.n / tree.n) * 100).toFixed(0)}% of {tree.n}</div>
                        <div className="tip-months">
                          {months.map((month, index) => (
                            <span key={month.m}>{MONTH_LABELS[index]}: <b>{comparisonCount(item.name, month)}</b></span>
                          ))}
                        </div>
                      </>,
                    )
                  }
                  onMouseLeave={tip.hide}
                >
                  <rect width={width} height={height} fill={color} rx={3} />
                  {width > 58 && height > 22 ? (
                    <text x={7} y={17} fill={textOn(color)} className="tile-t">
                      {label.length * 6.4 > width - 14 ? `${label.slice(0, Math.floor((width - 14) / 6.4) - 1)}…` : label}
                    </text>
                  ) : null}
                  {width > 34 && height > 38 ? <text x={7} y={33} fill={textOn(color)} className="tile-s">{item.n}</text> : null}
                  {item.flagged ? <text x={width - 7} y={15} textAnchor="end" fill={textOn(color)} className="tile-s">▲</text> : null}
                </g>
              );
            })}
          </svg>
        </div>
        {tip.node}
      </div>
    </section>
  );
}
