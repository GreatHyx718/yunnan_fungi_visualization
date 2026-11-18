import { useEffect, useMemo, useRef, useState } from "react";
import { arc } from "d3-shape";
import { hierarchy, partition } from "d3-hierarchy";
import { C, M_LIST, records, fmt } from "../../utils/theme.js";
import { Alert, Bi, Note, Step, useTip } from "../../utils/ui.jsx";

const RANKS = ["phylum", "class", "order", "family", "genus", "species"];
const RANK_ZH = { kingdom: "界", phylum: "门", class: "纲", order: "目", family: "科", genus: "属", species: "种" };
const SIZE = 760;
const R = SIZE / 2;
const UNIT = R / 4; // centre disc + three visible rings
const TAU = Math.PI * 2;

function buildTree() {
  const root = { name: "Fungi", rank: "kingdom", count: 0, edible: false, kids: new Map(), unid: 0 };
  for (const r of records) {
    let node = root;
    node.count++;
    if (r.ed) node.edible = true;
    for (const rank of RANKS) {
      const key = { phylum: r.ph, class: r.cl, order: r.or, family: r.fa, genus: r.ge, species: r.sp }[rank];
      if (!key) {
        node.unid++;
        if (r.ed) node.unidEdible = true;
        break;
      }
      if (!node.kids.has(key))
        node.kids.set(key, { name: key, rank, count: 0, edible: false, kids: new Map(), unid: 0 });
      node = node.kids.get(key);
      node.count++;
      if (r.ed) node.edible = true;
    }
  }
  const finish = (n) => {
    const children = [...n.kids.values()].sort((a, b) => b.count - a.count).map(finish);
    if (n.unid > 0 && children.length > 0)
      children.push({ name: "Unidentified", rank: "unid", count: n.unid, edible: !!n.unidEdible, children: [], parentName: n.name });
    // A node whose records all stop here (no children) stays a leaf.
    return { name: n.name, rank: n.rank, count: n.count, edible: n.edible, children, parentName: n.parentName };
  };
  return finish(root);
}

function assignColors(root) {
  const orders = root
    .descendants()
    .filter((d) => d.data.rank === "order")
    .sort((a, b) => b.data.count - a.data.count)
    .slice(0, 8);
  const orderColor = new Map(orders.map((d, i) => [d, M_LIST[i]]));
  const classes = root.descendants().filter((d) => d.data.rank === "class");
  root.each((d) => {
    const t = d.data.rank;
    if (t === "kingdom") d.color = C.p400;
    else if (t === "phylum") d.color = C.p400;
    else if (t === "class") d.color = classes.indexOf(d) % 2 === 0 ? C.a400 : C.a600;
    else if (t === "unid") d.color = C.n300;
    else {
      const o = d.ancestors().find((a) => a.data.rank === "order");
      d.color = (o && orderColor.get(o)) || "#b5b5ae";
    }
  });
}

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default function Sunburst() {
  const { root, nodes } = useMemo(() => {
    const tree = buildTree();
    const h = hierarchy(tree).sum((d) => (d.children.length ? 0 : d.count));
    partition().size([TAU, h.height + 1])(h);
    assignColors(h);
    const list = h.descendants();
    list.forEach((d, i) => (d.i = i));
    return { root: h, nodes: list };
  }, []);

  const [focus, setFocus] = useState(root);
  const [coords, setCoords] = useState(() => nodes.map((d) => target(d, root)));
  const [fade, setFade] = useState(1); // 0..1 progress of current transition
  const [prevVis, setPrevVis] = useState(null);
  const raf = useRef(0);
  const tip = useTip();

  function go(next) {
    if (next === focus) return;
    cancelAnimationFrame(raf.current);
    const from = coords.map((c) => c.slice());
    const to = nodes.map((d) => target(d, next));
    setPrevVis(from.map((c) => visible(c)));
    setFocus(next);
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 650);
      const e = ease(p);
      setCoords(from.map((f, i) => f.map((v, k) => v + (to[i][k] - v) * e)));
      setFade(p);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else setPrevVis(null);
    };
    raf.current = requestAnimationFrame(step);
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const arcGen = arc()
    .startAngle((c) => c[0])
    .endAngle((c) => c[1])
    .padAngle((c) => Math.min((c[1] - c[0]) / 2, 0.004))
    .padRadius(R / 2)
    .innerRadius((c) => c[2] * UNIT)
    .outerRadius((c) => Math.max(c[2] * UNIT, c[3] * UNIT - 1.5));

  const targetVis = nodes.map((d) => visible(target(d, focus)));
  const total = root.data.count;

  const describe = (d) => (
    <>
      <strong>{d.data.name}</strong>
      <div>
        {d.data.rank === "unid" ? "Not identified to next rank" : `${cap(d.data.rank)} ${RANK_ZH[d.data.rank] || ""}`}
      </div>
      <div>
        {fmt(d.value)} records · {((d.value / total) * 100).toFixed(1)}%
      </div>
      <div className="tip-sub">
        {d.data.edible
          ? d.data.rank === "species"
            ? "In the confirmed edible range"
            : "Contains confirmed edible species"
          : "No confirmed edible species"}
      </div>
    </>
  );

  return (
    <Step
      id="hierarchy"
      en="Taxonomic hierarchy"
      zh="分类层级与范围"
      desc="1,188 GBIF records from Yunnan (2010–2026), all in kingdom Fungi. Arc length is the record count. Click an arc to zoom in, click the centre to go back."
      descZh="点击弧段钻取，点击中心返回上一层。"
      wide
    >
      <div className="sun-layout">
        <div className="sun-stage">
          <svg viewBox={`${-R} ${-R} ${SIZE} ${SIZE}`} className="sunburst" role="img" aria-label="Zoomable sunburst of the taxonomic hierarchy">
            <g>
              {nodes.map((d, i) => {
                const now = targetVis[i];
                const was = prevVis ? prevVis[i] : false;
                if (!now && !was) return null;
                const c = coords[i];
                const op = now ? 1 : 1 - fade;
                return (
                  <path
                    key={i}
                    d={arcGen(c) || ""}
                    fill={d.color}
                    fillOpacity={(d.data.edible ? 0.95 : 0.4) * op}
                    stroke="#f0f0f0"
                    strokeWidth={0.6}
                    className={d.children ? "arc click" : "arc"}
                    onClick={() => d.children && now && go(d)}
                    onMouseMove={(e) => now && tip.show(e, describe(d))}
                    onMouseLeave={tip.hide}
                  />
                );
              })}
            </g>
            <g pointerEvents="none" textAnchor="middle">
              {nodes.map((d, i) => {
                if (!targetVis[i] || prevVis) return null;
                const c = coords[i];
                const mid = (c[0] + c[1]) / 2;
                const rr = ((c[2] + c[3]) / 2) * UNIT;
                const width = (c[1] - c[0]) * rr;
                if (width < 18 || c[3] - c[2] < 0.5) return null;
                const deg = (mid * 180) / Math.PI;
                const label = d.data.name.length * 6 > width ? d.data.name.slice(0, Math.max(2, Math.floor(width / 6.5) - 1)) + "…" : d.data.name;
                return (
                  <text
                    key={i}
                    className="arc-label"
                    transform={`rotate(${deg - 90}) translate(${rr},0) rotate(${deg < 180 ? 0 : 180})`}
                    dy="0.33em"
                    fill={d.color && ["#D4A76A", "#C2B280", "#B8A88A", "#b5b5ae", "#c8c8c8"].includes(d.color) ? C.text1 : "#fff"}
                  >
                    {label}
                  </text>
                );
              })}
            </g>
            <g onClick={() => focus.parent && go(focus.parent)} className={focus.parent ? "click" : ""}>
              <circle r={UNIT - 3} fill="#fff" stroke={C.n200} />
              <text textAnchor="middle" className="center-t" y={-6}>
                {focus.data.name}
              </text>
              <text textAnchor="middle" className="center-s" y={12}>
                {fmt(focus.value)} records
              </text>
              {focus.parent ? (
                <text textAnchor="middle" className="center-s" y={30}>
                  ‹ back
                </text>
              ) : null}
            </g>
          </svg>
          {tip.node}
        </div>
        <aside className="sun-side">
          <div className="panel">
            <div className="panel-label">
              <Bi en="How to read" zh="图例" />
            </div>
            <div className="legend-row">
              <i className="sw-chip" style={{ background: C.p400, opacity: 0.95 }} />
              <span>
                Solid: contains confirmed edible species <span className="zh">实心：含已确认可食种</span>
              </span>
            </div>
            <div className="legend-row">
              <i className="sw-chip" style={{ background: C.p400, opacity: 0.4 }} />
              <span>
                Faded: no confirmed edible species <span className="zh">淡色：不在可食范围</span>
              </span>
            </div>
            <div className="legend-row">
              <i className="sw-chip" style={{ background: C.n300 }} />
              <span>
                Unidentified to the next rank <span className="zh">未鉴定到下一级</span>
              </span>
            </div>
            <div className="legend-row">
              <i className="sw-chip" style={{ background: "#b5b5ae" }} />
              <span>
                Orders outside the top 8 <span className="zh">其他目</span>
              </span>
            </div>
            <p className="small">
              Colours mark the 8 orders with the most records; families, genera and species inherit the colour of their order.
            </p>
          </div>
          <Alert kind="warning">
            Basidiomycota holds 91% of the records, and most of that area is one class (Agaricomycetes).
            <span className="zh">担子菌门占 91% 的记录，伞菌纲占绝大部分。</span>
          </Alert>
          <Note>
            Edibility is judged at species level (Wu 2019, Zhang 2021). Above species, “solid” only means the node contains at least one confirmed edible species.
            Small arcs have no room for labels, so hover to read them.
          </Note>
        </aside>
      </div>
    </Step>
  );
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function target(d, p) {
  const span = p.x1 - p.x0;
  const clamp = (v) => Math.max(0, Math.min(1, (v - p.x0) / span));
  return [clamp(d.x0) * TAU, clamp(d.x1) * TAU, Math.max(0, d.y0 - p.depth), Math.max(0, d.y1 - p.depth)];
}
function visible(c) {
  return c[3] <= 4.0001 && c[2] >= 0.999 && c[1] - c[0] > 0.0015;
}
