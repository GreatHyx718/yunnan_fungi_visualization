import { records } from "./theme.js";

export const RANKS = ["phylum", "class", "order", "family", "genus", "species"];
export const RANK_LABEL = { root: "All", phylum: "Phylum", class: "Class", order: "Order", family: "Family", genus: "Genus", species: "Species", unid: "Unidentified" };
export const LEVEL_LABEL = ["Fungi", "Phylum", "Class", "Order", "Family", "Genus", "Species"];
export const LEVEL_TOTAL = [1, 2, 7, 30, 95, 271, 393];
export const NEXT_PLURAL = { root: "phyla", phylum: "classes", class: "orders", order: "families", family: "genera", genus: "species" };
// Dot size depends only on the level: the higher the level, the bigger the dot.
export const LEVEL_SIZE = [15, 11, 8.5, 6.5, 5, 4, 3.2];
// A view always shows four levels (parent, focus, children, grandchildren; for the whole
// dataset: root, phylum, class, order), so dot size follows the slot, not the taxonomic rank.
export const SLOT_SIZE = [7, 5, 3.5, 2.25];
export const slotOf = (n, focus) => n.depth - (focus.rank === "root" ? 0 : focus.depth - 1);

/** Taxonomy tree root > phylum > class > order > family > genus > species.
 *  A record stops at the first rank it is missing and is counted in an "Unidentified" child
 *  of that node, so every record stays in the graph. Colour depends on the level only
 *  (dark green at the top, lighter greens further down). */
export function buildTree(tokens) {
  const make = (name, rank, parent, id) => ({
    id, name, rank, parent, count: 0, ed: 0, tox: 0, kids: new Map(), unid: 0, unidEd: 0, unidTox: 0,
  });
  const root = make("Fungi", "root", null, "root");
  for (const r of records) {
    const edible = r.ed > 0 ? 1 : 0;
    const toxic = r.ed === 2 ? 1 : 0;
    let node = root;
    node.count++;
    node.ed += edible;
    node.tox += toxic;
    for (const rank of RANKS) {
      const key = { phylum: r.ph, class: r.cl, order: r.or, family: r.fa, genus: r.ge, species: r.sp }[rank];
      if (!key) {
        node.unid++;
        node.unidEd += edible;
        node.unidTox += toxic;
        break;
      }
      if (!node.kids.has(key)) node.kids.set(key, make(key, rank, node, `${node.id}/${key}`));
      node = node.kids.get(key);
      node.count++;
      node.ed += edible;
      node.tox += toxic;
    }
  }
  const finish = (n, depth) => {
    n.depth = depth;
    n.type = n.rank === "root" ? "root" : "node";
    n.size = LEVEL_SIZE[depth];
    n.color = tokens.levels[depth];
    n.children = [...n.kids.values()].sort((a, b) => b.count - a.count);
    n.children.forEach((c) => finish(c, depth + 1));
    if (n.unid > 0 && n.children.length > 0)
      n.children.push({
        id: `${n.id}/?`, name: "Unidentified to the next rank", rank: "unid", type: "node", parent: n, depth: depth + 1,
        size: LEVEL_SIZE[depth + 1], color: tokens.neutral, count: n.unid, ed: n.unidEd, tox: n.unidTox, children: [],
      });
    return n;
  };
  finish(root, 0);

  const classes = [];
  root.children.forEach((ph) => ph.children.forEach((c) => c.rank === "class" && classes.push(c)));
  classes.sort((a, b) => b.count - a.count);
  const legend = classes.map((cl) => ({ node: cl, orders: cl.children.filter((o) => o.rank === "order") }));
  return { root, legend };
}

export const ancestorsOf = (n) => {
  const out = [];
  for (let p = n; p; p = p.parent) out.push(p);
  return out;
};

const levelsBelow = (focus) => (focus.rank === "root" ? 3 : 2);

/** Nodes on screen for a focus: its parent (one dot), itself, and two levels below.
 *  With the whole-dataset focus the map opens three levels deep: phylum > class > order. */
export function visibleFor(focus) {
  const out = [];
  if (focus.parent) out.push(focus.parent);
  out.push(focus);
  let layer = [focus];
  for (let i = 0; i < levelsBelow(focus); i++) {
    layer = layer.flatMap((n) => n.children);
    out.push(...layer);
  }
  return out;
}

/** Child with the most records (ignoring unidentified): the default way into the next level. */
export const defaultChild = (n) => n.children.find((c) => c.rank !== "unid") || null;

/** Tree path a -> b through their closest common ancestor. */
export function pathBetween(a, b) {
  const up = ancestorsOf(a);
  const down = ancestorsOf(b);
  const common = up.find((n) => down.includes(n));
  const left = up.slice(0, up.indexOf(common) + 1);
  const right = down.slice(0, down.indexOf(common)).reverse();
  return [...left, ...right];
}

const GOLDEN = 2.399963;
const LEAF_R = 15;
const hashAngle = (id) => {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return (((h >>> 0) % 1000) / 1000) * Math.PI * 2;
};

/** Cluster layout around the focus (focus at 0,0).
 *  Every visible node that has children becomes a compact cluster: its children sit close
 *  around it, either evenly on a ring (few children, with a gap on the side facing the parent)
 *  or on a tight spiral (many children). Clusters are nested, so a class is a cloud of orders
 *  and the whole phylum is a cloud of those clouds. */
export function clusterTargets(focus) {
  const maxRel = levelsBelow(focus);
  const kidsOf = (n, rel) => (rel < maxRel ? n.children : []);
  const ringSpan = (5 * Math.PI) / 3;
  // out: radius of the whole cluster; inner: how far it reaches back toward its parent
  const info = new Map();
  const measure = (n, rel) => {
    const kids = kidsOf(n, rel);
    if (!kids.length) {
      info.set(n.id, { out: LEAF_R, inner: LEAF_R });
      return;
    }
    kids.forEach((c) => measure(c, rel + 1));
    const radii = kids.map((c) => info.get(c.id).out);
    const inners = kids.map((c) => info.get(c.id).inner);
    const minR = n.size + 16;
    const maxCr = Math.max(...radii);
    const ring = kids.length <= 7;
    const span = n.parent ? ringSpan : 2 * Math.PI;
    const rho = ring
      ? Math.max(minR, (2 * radii.reduce((a, r) => a + r + 8, 0)) / span, Math.max(...inners) + n.size + 8)
      : Math.max(minR, 1.4 * Math.sqrt(radii.reduce((a, r) => a + r * r, 0)));
    // below the focus, a cluster leans away from its parent so the hub sits at its near edge
    const shift = rel > 0 ? 0.6 * rho : 0;
    info.set(n.id, {
      out: rho + maxCr,
      inner: Math.max(n.size + 8, rho + maxCr - shift),
      rho, ring, span, minR, shift,
    });
  };
  measure(focus, 0);

  const target = new Map([[focus.id, [0, 0]]]);
  const place = (n, rel, hx, hy, towardParent) => {
    const kids = kidsOf(n, rel);
    if (!kids.length) return;
    const { rho, ring, span, minR, shift } = info.get(n.id);
    const cx = hx + Math.cos(towardParent + Math.PI) * shift;
    const cy = hy + Math.sin(towardParent + Math.PI) * shift;
    const crs = kids.map((c) => info.get(c.id).out);
    if (ring) {
      const weights = crs.map((r) => r + 8);
      const total = weights.reduce((a, b) => a + b, 0);
      // leave the gap on the side that faces the parent
      let ang = towardParent + (2 * Math.PI - span) / 2;
      kids.forEach((c, i) => {
        const share = (span * weights[i]) / total;
        const mid = ang + share / 2;
        ang += share;
        const x = cx + Math.cos(mid) * rho;
        const y = cy + Math.sin(mid) * rho;
        target.set(c.id, [x, y]);
        place(c, rel + 1, x, y, Math.atan2(hy - y, hx - x));
      });
    } else {
      const areas = crs.map((r) => r * r);
      const total = areas.reduce((a, b) => a + b, 0);
      const phase = hashAngle(n.id);
      let acc = 0;
      kids.forEach((c, i) => {
        const f = Math.sqrt((acc + areas[i] / 2) / total);
        acc += areas[i];
        const r = minR + (rho - minR) * f;
        const a = phase + i * GOLDEN;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        target.set(c.id, [x, y]);
        place(c, rel + 1, x, y, Math.atan2(hy - y, hx - x));
      });
    }
  };
  place(focus, 0, 0, 0, -Math.PI / 2);
  if (focus.parent) {
    // with a ring of children the parent sits in the gap above it; with a spiral it sits outside
    const f = info.get(focus.id);
    target.set(focus.parent.id, [0, -(f.ring ? f.rho + 45 : f.out + 45)]);
  }
  return target;
}
