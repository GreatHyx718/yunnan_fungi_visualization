// Builds src/data/app-data.json and src/data/prefectures.json from data/.
// Run: node scripts/build-data.mjs
import fs from "node:fs";

const read = (p) => fs.readFileSync(p, "utf8");
const jsonl = (p) =>
  read(p)
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
const csv = (p, n) =>
  read(p)
    .trim()
    .split("\n")
    .slice(1)
    .map((l) => l.split(",").slice(0, n));

const main = jsonl("data/redlist/yunnan_2010_2026_combined.jsonl");
const edible = new Map(
  jsonl("data/edible/yunnan_edible_2010_2026.jsonl").map((e) => [
    e.gbifID,
    e.edible_status === "edible" ? 1 : 2, // 2 = edible but flagged toxic
  ]),
);

const counties = JSON.parse(read("data/geography/yunnan_counties.geojson"));
const prefs = JSON.parse(read("data/geography/yunnan_prefectures.geojson"));

// Planar ray-casting test (d3 geoContains is winding-sensitive and these files
// are not wound the way d3 expects).
const inRing = (ring, x, y) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const inPolygon = (poly, x, y) =>
  inRing(poly[0], x, y) && !poly.slice(1).some((h) => inRing(h, x, y));
const contains = (f, x, y) => {
  const g = f.geometry;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  return polys.some((p) => inPolygon(p, x, y));
};
const findCounty = (lon, lat) => counties.features.find((f) => contains(f, lon, lat));

const records = main.map((r) => {
  const has = r.decimalLatitude != null && r.decimalLongitude != null;
  const c = has ? findCounty(r.decimalLongitude, r.decimalLatitude) : null;
  return {
    id: r.gbifID,
    m: r.month ?? null,
    y: r.year ?? null,
    lon: has ? +r.decimalLongitude.toFixed(4) : null,
    lat: has ? +r.decimalLatitude.toFixed(4) : null,
    el: r.elevation_dem ?? null,
    ph: r.phylum || null,
    cl: r.class || null,
    or: r.order || null,
    fa: r.family || null,
    ge: r.genus || null,
    sp: r.species || null,
    ed: edible.get(r.gbifID) ?? 0,
    pf: c?.properties.prefecture_adcode ?? null,
    ct: c?.properties.adcode ?? null,
  };
});

const coordN = records.filter((r) => r.lat != null).length;
const placed = records.filter((r) => r.ct != null).length;
console.log("records", records.length, "with coords", coordN, "in county", placed);

const countyList = counties.features.map((f) => ({
  id: f.properties.adcode,
  name: f.properties.name,
  pref: f.properties.prefecture_adcode,
  center: f.properties.center,
}));

const topMonths = [6, 7, 8, 9, 10];
const edibleRecords = records.filter((r) => r.ed);
const allMonthCounts = new Map();
for (const r of edibleRecords) {
  const family = r.fa || "Unidentified";
  allMonthCounts.set(family, (allMonthCounts.get(family) || 0) + 1);
}
const top5 = topMonths.flatMap((month) => {
  const monthRecords = edibleRecords.filter((r) => r.m === month);
  const families = new Map();
  for (const r of monthRecords) {
    const family = r.fa || "Unidentified";
    const item = families.get(family) || { family, records: 0, genera: new Set(), species: new Set(), flagged: 0 };
    item.records++;
    if (r.ge) item.genera.add(r.ge);
    if (r.sp) item.species.add(r.sp);
    if (r.ed === 2) item.flagged++;
    families.set(family, item);
  }
  return [...families.values()]
    .sort((a, b) => b.records - a.records || allMonthCounts.get(b.family) - allMonthCounts.get(a.family) || a.family.localeCompare(b.family))
    .slice(0, 5)
    .map((item, index) => ({
      month,
      rank: index + 1,
      family: item.family,
      records: item.records,
      genusN: item.genera.size,
      speciesN: item.species.size,
      flagged: item.flagged,
      allMonths: allMonthCounts.get(item.family),
      monthTotal: monthRecords.length,
    }));
});

const cdc = {
  annual: csv("data/cdc/part3_yunnan_annual_patients_deaths.csv", 3).map((c) => ({
    year: +c[0],
    patients: +c[1],
    deaths: +c[2],
  })),
  timing: csv("data/cdc/part3_timing_total_vs_toxic.csv", 3).map((c) => ({
    month: +c[0],
    total: +c[1],
    toxic: +c[2],
  })),
  monthly2025: csv("data/cdc/yunnan_2025_monthly_incidents.csv", 2).map((c) => ({
    month: +c[0],
    incidents: +c[1],
  })),
};

fs.mkdirSync("src/data", { recursive: true });
fs.writeFileSync(
  "src/data/app-data.json",
  JSON.stringify({ records, counties: countyList, top5, cdc }),
);
fs.copyFileSync(
  "data/geography/yunnan_prefectures.geojson",
  "src/data/prefectures.json",
);
// County outlines are needed for the county-level choropleth (step 7).
fs.copyFileSync(
  "data/geography/yunnan_counties.geojson",
  "src/data/counties.json",
);
console.log("written src/data/*");
