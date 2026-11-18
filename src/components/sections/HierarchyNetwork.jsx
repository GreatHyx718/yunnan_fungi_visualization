import { useEffect, useMemo, useRef, useState } from "react";
import { select } from "d3-selection";
import { zoom, zoomIdentity } from "d3-zoom";
import { drag } from "d3-drag";
import { forceSimulation, forceManyBody, forceCollide, forceX, forceY } from "d3-force";
import { interpolateZoom } from "d3-interpolate";
import { records, fmt } from "../../utils/theme.js";
import { Bi } from "../../utils/ui.jsx";
import { buildTree, ancestorsOf, visibleFor, defaultChild, pathBetween, clusterTargets, SLOT_SIZE, slotOf } from "../../utils/taxonTree.js";
import { Legend, HoverCard, zhOf } from "./HierarchyPanels.jsx";
import "../../styles/hierarchyNetwork.css";

const DIM = 0.15;

function readTokens() {
  const cs = getComputedStyle(document.documentElement);
  const v = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
  const fallback = ["#344c3d", "#4a7a5c", "#5c9163", "#6ba070", "#8c9d83", "#a2b394", "#bccaae"];
  return {
    levels: fallback.map((f, i) => v(`--g-${i}`, f)),
    neutral: v("--n-300", "#c8c8c8"),
    brand: v("--p-400", "#344C3D"),
  };
}

const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
};
const shortName = (n) => {
  if (n.rank !== "species") return n.name;
  const [g, ...rest] = n.name.split(" ");
  return `${g[0]}. ${rest.join(" ")}`;
};
const labelOf = (n) => (n.type === "root" ? "云南菌菇" : zhOf(n.name) || shortName(n));
const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

export default function HierarchyNetwork() {
  const tokens = useMemo(() => readTokens(), []);
  const tree = useMemo(() => buildTree(tokens), [tokens]);
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const api = useRef({});
  const modeRef = useRef("all");
  const [mode, setMode] = useState("all"); // all | edible | toxic
  const [tip, setTip] = useState(null);
  const [crumbs, setCrumbs] = useState([tree.root]);

  useEffect(() => {
    const { root } = tree;
    const svg = select(svgRef.current);
    const wrap = wrapRef.current;
    svg.selectAll("*").remove();
    const defs = svg.append("defs");
    const view = svg.append("g");
    const linkG = view.append("g").attr("fill", "none");
    const flowG = view.append("g").attr("fill", "none");
    const nodeG = view.append("g");
    const pulse = view.append("g").attr("class", "fn-pulse").style("opacity", 0).attr("pointer-events", "none");
    pulse.append("circle").attr("r", 16).attr("fill", tokens.brand).attr("fill-opacity", 0.14);
    pulse.append("circle").attr("r", 6).attr("fill", tokens.brand).attr("stroke", "#fff").attr("stroke-width", 2);

    let focus = root;
    let nodes = [];
    let links = [];
    let gradSel = defs.selectAll("linearGradient");
    let linkSel = linkG.selectAll("line");
    let flowSel = flowG.selectAll("path");
    let nodeSel = nodeG.selectAll("g");
    let hover = null;
    let k = 1;
    let busy = false;
    let gcount = 0;
    const timers = [];
    let anim = 0;
    let flyAnim = 0;
    const later = (fn, ms) => {
      timers.push(setTimeout(fn, ms));
    };

    const matches = (n) => {
      const m = modeRef.current;
      if (m === "all" || n.rank === "root") return true;
      return m === "edible" ? n.ed > 0 : n.tox > 0;
    };

    // hover: the dot and its direct next level stay lit, everything else fades
    function restyle() {
      const ids = new Set(nodes.map((n) => n.id));
      const rel = hover && ids.has(hover.id) ? new Set([hover.id, ...hover.children.map((c) => c.id)]) : null;
      const f = (n) => (rel && !rel.has(n.id) ? DIM : 1) * (matches(n) ? 1 : 0.2);
      nodeSel.style("opacity", f);
      const lf = (d) => Math.min(f(d.source), f(d.target));
      linkSel.style("opacity", lf);
      const hot = (d) => !!hover && d.source === hover;
      flowSel.style("opacity", (d) => lf(d) * (hot(d) ? 1 : 0.65)).classed("hot", hot);
      nodeSel.select("text").attr("display", (d) => {
        const rl = d.depth - focus.depth;
        return nodes.length <= 60 || rl <= 1 || k >= 1 || (rel && rel.has(d.id)) ? null : "none";
      });
    }

    // ---- simulation: nodes are pulled to their radial-tree slot, collisions keep them apart ----
    const sim = forceSimulation()
      .force("charge", forceManyBody().strength(-8).distanceMax(120))
      .force("collide", forceCollide().radius((d) => d.size + 3).strength(0.7))
      .force("x", forceX((d) => d.tx).strength(0.14))
      .force("y", forceY((d) => d.ty).strength(0.14))
      .velocityDecay(0.35)
      .alphaDecay(0.035);

    function paint() {
      gradSel
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
      linkSel
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
      const line = (d) => `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
      flowSel.attr("d", line);
      nodeSel.attr("transform", (d) => `translate(${d.x},${d.y})`);
    }
    sim.on("tick", paint);

    const dragger = drag()
      .on("start", (e, d) => {
        if (!e.active) sim.alphaTarget(0.2).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (e, d) => {
        d.fx = e.x;
        d.fy = e.y;
      })
      .on("end", (e, d) => {
        if (!e.active) sim.alphaTarget(0);
        if (d !== focus) {
          d.fx = null;
          d.fy = null;
        }
      });

    function update() {
      const prev = new Set(nodes.map((n) => n.id));
      const first = prev.size === 0;
      nodes = visibleFor(focus);
      const inSet = new Set(nodes.map((n) => n.id));
      links = nodes.filter((n) => n.parent && inSet.has(n.parent.id)).map((n) => ({ source: n.parent, target: n }));

      // dot size follows the slot in this view (parent, focus, children, grandchildren)
      nodes.forEach((n) => {
        n.slot = slotOf(n, focus);
        n.size = SLOT_SIZE[Math.min(3, Math.max(0, n.slot))];
      });
      // radial-tree slots, measured from where the focus currently sits
      const slots = clusterTargets(focus);
      // stretch the layout vertically when it is wider than the map box, so it fills the box
      {
        const [cw, ch] = size();
        if (cw > 0 && ch > 0) {
          const ts = [...slots.values()];
          const span = (i) => Math.max(...ts.map((t) => t[i])) - Math.min(...ts.map((t) => t[i]));
          const aspect = (span(0) + 230) / (span(1) + 60);
          const stretch = Math.max(1, Math.min(2.2, aspect / (cw / ch)));
          if (stretch > 1) slots.forEach((t, id) => slots.set(id, [t[0], t[1] * stretch]));
        }
      }
      const ox = Number.isFinite(focus.x) ? focus.x : 0;
      const oy = Number.isFinite(focus.y) ? focus.y : 0;
      nodes.forEach((n) => {
        const t = slots.get(n.id) || [0, 0];
        n.tx = ox + t[0];
        n.ty = oy + t[1];
        const pt = n.parent ? slots.get(n.parent.id) : null;
        n.left = !!pt && t[0] < pt[0] - 6;
        if (first) {
          n.x = n.tx;
          n.y = n.ty;
        } else if (!prev.has(n.id)) {
          const o = n.parent && Number.isFinite(n.parent.x) ? n.parent : focus;
          n.x = (o.x || 0) + (hash(n.id) - 0.5) * 6;
          n.y = (o.y || 0) + (hash(n.id + "y") - 0.5) * 6;
          n.vx = 0;
          n.vy = 0;
        }
      });
      sim.nodes(nodes);

      const gid = (d) => d.target.gid || (d.target.gid = ++gcount);
      gradSel = defs
        .selectAll("linearGradient")
        .data(links, (d) => d.target.id)
        .join((enter) => {
          const g = enter.append("linearGradient").attr("gradientUnits", "userSpaceOnUse").attr("id", (d) => `lg-${gid(d)}`);
          g.append("stop").attr("offset", "0%").attr("stop-color", (d) => d.source.color).attr("stop-opacity", 0.95);
          g.append("stop").attr("offset", "100%").attr("stop-color", (d) => d.target.color).attr("stop-opacity", 0.5);
          return g;
        });

      const delay = (d) => `${Math.max(0, (d.target.depth - focus.depth - 1) * 0.2)}s`;
      linkSel = linkG
        .selectAll("line")
        .data(links, (d) => d.target.id)
        .join(
          (enter) => enter.append("line").style("opacity", 0).style("transition-delay", delay),
          (u) => u,
          (exit) => {
            exit.style("opacity", 0);
            later(() => exit.remove(), 320);
          },
        )
        .attr("stroke", (d) => `url(#lg-${gid(d)})`)
        .attr("stroke-width", (d) => 1.2 + (d.target.depth <= 2 ? 0.8 : 0));

      flowSel = flowG
        .selectAll("path")
        .data(links, (d) => d.target.id)
        .join(
          (enter) =>
            enter
              .append("path")
              .attr("class", "fn-flow")
              .attr("pathLength", 100)
              .style("opacity", 0)
              .style("transition-delay", delay)
              .style("--dur", (d) => `${3 + hash(d.target.id) * 2.6}s`)
              .style("--delay", (d) => `${-hash(d.target.id + "d") * 5}s`),
          (u) => u,
          (exit) => {
            exit.style("opacity", 0);
            later(() => exit.remove(), 320);
          },
        );

      nodeSel = nodeG
        .selectAll("g.fn-node")
        .data(nodes, (d) => d.id)
        .join(
          (enter) => {
            const g = enter.append("g").attr("class", "fn-node").style("opacity", 0).style("transition-delay", (d) => `${Math.max(0, (d.depth - focus.depth - 1) * 0.2)}s`);
            g.append("circle").attr("class", "fn-halo").attr("r", (d) => d.size + 6).attr("fill", tokens.brand).attr("fill-opacity", 0.13);
            g.append("circle")
              .attr("class", "fn-dot")
              .attr("r", (d) => d.size)
              .attr("fill", (d) => (d.ed > 0 ? d.color : "#f0f0f0"))
              .attr("fill-opacity", (d) => (d.ed > 0 ? 0.95 : 1))
              .attr("stroke", (d) => (d.ed > 0 ? "#fff" : d.color))
              .attr("stroke-width", (d) => (d.ed > 0 ? 0.9 : 1.8));
            const t = g.append("text").attr("class", (d) => `fn-label fn-l-${d.rank}`).attr("dy", "0.33em");
            t.append("tspan").text(labelOf);
            t.append("tspan").attr("class", "n").attr("dx", 5).text((d) => fmt(d.count));
            return g;
          },
          (u) => u,
          (exit) => {
            exit.style("opacity", 0);
            later(() => exit.remove(), 320);
          },
        );

      nodeSel
        .call(dragger)
        .classed("is-focus", (d) => d === focus)
        .on("mouseenter", (e, d) => {
          hover = d;
          restyle();
        })
        .on("mousemove", (e, d) => setTip({ node: d, x: e.clientX, y: e.clientY }))
        .on("mouseleave", () => {
          hover = null;
          setTip(null);
          restyle();
        })
        .on("click", (e, d) => {
          e.stopPropagation();
          if (d.rank !== "unid" && d !== focus) goTo(d);
        });
      // labels sit on the outer side of each dot
      nodeSel
        .select("text")
        .attr("text-anchor", (d) => (d.left ? "end" : "start"))
        .attr("x", (d) => (d.left ? -(d.size + 5) : d.size + 5));
      nodeSel.selectAll("tspan.n").attr("dx", (d) => (d.left ? 0 : 5));
      nodeSel
        .select(".fn-dot")
        .attr("r", (d) => d.size)
        .style("r", (d) => `${d.size}px`)
        .attr("stroke-width", (d) => (d.ed > 0 ? 0.6 : Math.max(1, d.size * 0.35)));
      nodeSel.select(".fn-halo").attr("r", (d) => d.size + 4);

      nodes.forEach((n) => {
        if (n === focus) {
          n.fx = n.tx;
          n.fy = n.ty;
        } else if (n.fx != null) {
          n.fx = null;
          n.fy = null;
        }
      });
      restyle();
      // new nodes and lines fade in on the following frames, level by level
      const fresh = new Set([...inSet].filter((id) => !prev.has(id)));
      if (fresh.size && !first) {
        nodeSel.filter((d) => fresh.has(d.id)).style("opacity", 0);
        linkSel.filter((d) => fresh.has(d.target.id)).style("opacity", 0);
        flowSel.filter((d) => fresh.has(d.target.id)).style("opacity", 0);
        requestAnimationFrame(() => requestAnimationFrame(restyle));
        later(() => {
          nodeSel.style("transition-delay", null);
          linkSel.style("transition-delay", null);
          flowSel.style("transition-delay", null);
        }, 1400);
      }
    }

    // ---- camera ----
    const size = () => {
      const r = wrap.getBoundingClientRect();
      return [r.width, r.height];
    };
    const zoomer = zoom()
      .scaleExtent([0.15, 8])
      .filter((e) => (e.type === "wheel" ? e.ctrlKey || e.metaKey : !e.button))
      .on("zoom", (e) => {
        view.attr("transform", e.transform);
        const before = k >= 0.9;
        k = e.transform.k;
        if (before !== k >= 0.9) restyle();
      });
    svg.call(zoomer).on("dblclick.zoom", null);

    function flyTo(t, done) {
      cancelAnimationFrame(flyAnim);
      const [w, h] = size();
      const cur = svg.property("__zoom");
      const a = [(w / 2 - cur.x) / cur.k, (h / 2 - cur.y) / cur.k, w / cur.k];
      const b = [(w / 2 - t.x) / t.k, (h / 2 - t.y) / t.k, w / t.k];
      const i = interpolateZoom(a, b);
      const t0 = performance.now();
      const dur = Math.min(900, 320 + i.duration * 0.4);
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const [cx, cy, ww] = i(ease(p));
        const s = w / ww;
        svg.call(zoomer.transform, zoomIdentity.translate(w / 2 - cx * s, h / 2 - cy * s).scale(s));
        if (p < 1) flyAnim = requestAnimationFrame(step);
        else done?.();
      };
      flyAnim = requestAnimationFrame(step);
    }
    // fit the camera to where the nodes are going (their slots), not where they are now
    function fitSlots(maxK = 1.7) {
      const [w, h] = size();
      const left = 20, top = 20, bottom = 20, right = 20;
      const xs = nodes.map((n) => n.tx);
      const ys = nodes.map((n) => n.ty);
      const x0 = Math.min(...xs) - 60, x1 = Math.max(...xs) + 150;
      const y0 = Math.min(...ys) - 30, y1 = Math.max(...ys) + 30;
      const aw = w - left - right, ah = h - top - bottom;
      const s = Math.min(maxK, aw / (x1 - x0), ah / (y1 - y0));
      return zoomIdentity.translate(left + aw / 2 - ((x0 + x1) / 2) * s, top + ah / 2 - ((y0 + y1) / 2) * s).scale(s);
    }

    // ---- moving the focus: a marker travels along the tree path, the camera follows ----
    function goTo(target) {
      if (busy || target === focus) return;
      busy = true;
      hover = null;
      setTip(null);
      const shown = new Set(nodes.map((n) => n.id));
      const route = pathBetween(focus, target).filter((n) => shown.has(n.id) && Number.isFinite(n.x));
      const finish = () => {
        pulse.style("opacity", 0);
        focus = target;
        setCrumbs(ancestorsOf(target).reverse());
        update();
        sim.alpha(0.9).restart();
        later(() => flyTo(fitSlots(), () => (busy = false)), 200);
      };
      if (route.length < 2) {
        finish();
        return;
      }
      const pts = route.map((n) => [n.x, n.y]);
      const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
      const total = seg.reduce((a, b) => a + b, 0) || 1;
      const at = (d) => {
        let acc = 0;
        for (let i = 0; i < seg.length; i++) {
          if (d <= acc + seg[i] || i === seg.length - 1) {
            const f = seg[i] ? Math.min(1, (d - acc) / seg[i]) : 0;
            return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
          }
          acc += seg[i];
        }
        return pts[pts.length - 1];
      };
      const [w, h] = size();
      const cur = svg.property("__zoom");
      const c0 = [(w / 2 - cur.x) / cur.k, (h / 2 - cur.y) / cur.k];
      const dur = 650 + 250 * (pts.length - 2);
      const t0 = performance.now();
      pulse.style("opacity", 1);
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const e = ease(p);
        const pos = at(total * e);
        pulse.attr("transform", `translate(${pos[0]},${pos[1]})`);
        const cx = c0[0] + (pos[0] - c0[0]) * e;
        const cy = c0[1] + (pos[1] - c0[1]) * e;
        svg.call(zoomer.transform, zoomIdentity.translate(w / 2 - cx * cur.k, h / 2 - cy * cur.k).scale(cur.k));
        if (p < 1) anim = requestAnimationFrame(step);
        else finish();
      };
      anim = requestAnimationFrame(step);
    }

    // wheel: down = go in (hovered dot first, else the largest branch), up = back to the parent
    let wheelAcc = 0;
    let wheelReset = 0;
    // Inside the map box the wheel steers the levels: down goes into the dot under the cursor,
    // otherwise into the largest branch; up goes back. Outside the box the page scrolls as usual,
    // and so it does inside the box when there is no further level to go to.
    const nextTarget = () => {
      const inside = hover && hover !== focus && hover.rank !== "unid" && hover.children.length && ancestorsOf(hover).includes(focus);
      return inside ? hover : defaultChild(focus);
    };
    const onWheel = (e) => {
      if (e.ctrlKey || e.metaKey) return;
      if (e.deltaY < 0 && !focus.parent) return;
      if (e.deltaY > 0 && !nextTarget()) return;
      e.preventDefault();
      wheelAcc += e.deltaY;
      clearTimeout(wheelReset);
      wheelReset = setTimeout(() => (wheelAcc = 0), 220);
      if (Math.abs(wheelAcc) < 40 || busy) return;
      const dir = wheelAcc > 0 ? 1 : -1;
      wheelAcc = 0;
      if (dir < 0) {
        if (focus.parent) goTo(focus.parent);
        return;
      }
      const next = nextTarget();
      if (next) goTo(next);
    };
    svgRef.current.addEventListener("wheel", onWheel, { passive: false });

    // ---- start: whole dataset, phylum > class > order ----
    root.x = 0;
    root.y = 0;
    update();
    sim.stop();
    for (let i = 0; i < 60; i++) sim.tick();
    paint();
    sim.alpha(0.05).restart();
    svg.call(zoomer.transform, fitSlots());
    nodeSel.style("opacity", 1);
    restyle();

    api.current = {
      restyle,
      goToId: (id) => {
        const target = ancestorsOf(focus).concat(nodes).find((n) => n.id === id);
        if (target) goTo(target);
      },
      zoomBy: (f) => svg.call(zoomer.scaleBy, f),
      refit: () => flyTo(fitSlots()),
      up: () => focus.parent && goTo(focus.parent),
      down: () => {
        const n = defaultChild(focus);
        if (n) goTo(n);
      },
    };
    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(anim);
      cancelAnimationFrame(flyAnim);
      clearTimeout(wheelReset);
      sim.stop();
      svgRef.current?.removeEventListener("wheel", onWheel);
    };
  }, [tree, tokens]);

  useEffect(() => {
    modeRef.current = mode;
    api.current.restyle?.();
  }, [mode]);

  const focus = crumbs[crumbs.length - 1];

  return (
    <section id="hierarchy" className="fn-section">
      <div className="fn-story">
        <header className="fn-head">
          <h2>
            <Bi en="Taxonomic hierarchy" />
          </h2>
        </header>
        <div className="fn-text">
          <p>
            I&rsquo;m Xiaojun. I used to follow Grandma up the mountain; now I study away from home and only come back in summer.
          </p>
          <p>
            Lately I take a photo of whatever I find and upload it. I&rsquo;m not the only one: <strong>1,188 records</strong> from Yunnan
            between 2010 and 2026 were made this way. Each one is a photo, a place and a date.
          </p>
        </div>
      </div>

      <div className="fn-stage">
        <div className="fn-canvas" ref={wrapRef}>
          <svg ref={svgRef} className="fn-svg" role="img" aria-label="Force-directed taxonomy map from phylum to species" />
        </div>

        <nav className="fn-focus" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={c.id} style={{ display: "contents" }}>
              {i > 0 ? <span className="sep">›</span> : null}
              <button type="button" aria-current={c === focus} onClick={() => api.current.goToId(c.id)}>
                {c.rank === "root" ? "全部" : zhOf(c.name) || c.name} ({fmt(c.count)})
              </button>
            </span>
          ))}
        </nav>

        <div className="fn-tools">
          <button type="button" aria-label="放大" onClick={() => api.current.zoomBy(1.4)}>+</button>
          <button type="button" aria-label="缩小" onClick={() => api.current.zoomBy(1 / 1.4)}>−</button>
          <button type="button" aria-label="回到全部" onClick={() => api.current.goToId("root")}>⟲</button>
          <button type="button" aria-label="上一层" title="上一层" onClick={() => api.current.up()}>↑</button>
          <button type="button" aria-label="下一层（最大分支）" title="下一层（最大分支）" onClick={() => api.current.down()}>↓</button>
        </div>

        <Legend tokens={tokens} mode={mode} setMode={setMode} />

        {tip ? <HoverCard node={tip.node} x={tip.x} y={tip.y} total={records.length} focus={focus} /> : null}
      </div>
    </section>
  );
}
