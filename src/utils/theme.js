import data from "../data/app-data.json";
import prefectures from "../data/prefectures.json";

export const records = data.records;
export const counties = data.counties;
export const top5 = data.top5;
export const cdc = data.cdc;
export { prefectures };

export const C = {
  p50: "#f0f4f1",
  p100: "#d4e0d8",
  p200: "#a8c1b1",
  p400: "#344C3D",
  p600: "#2a3d33",
  a200: "#c1d0b8",
  a400: "#8C9D83",
  a600: "#717e69",
  signal: "#A0826D",
  signalSoft: "#f0ebe6",
  signalDeep: "#6B5444",
  warning: "#C4A058",
  info: "#7D8CA3",
  n100: "#e8e8e8",
  n200: "#dcdcdc",
  n300: "#c8c8c8",
  n500: "#888888",
  text1: "#2c2c2c",
  text2: "#5a5a5a",
  text3: "#8a8a8a",
  map: "#e8e4dc",
  surface: "#ffffff",
};

// Morandi taxonomy palette from the design system (no red/green contrast).
export const M = {
  rose: "#C38D9E",
  sky: "#85B8CB",
  gold: "#D4A76A",
  taupe: "#B8A88A",
  slate: "#7D8CA3",
  mauve: "#A8908E",
  olive: "#9CB380",
  sand: "#C2B280",
};
export const M_LIST = Object.values(M);
// Text colour that keeps contrast on each swatch (design system 02b).
export const DARK_TEXT = new Set([M.gold, M.sand, M.taupe, "#bdbdb6", "#d9d9d4"]);
export const textOn = (bg) => (DARK_TEXT.has(bg) ? C.text1 : "#ffffff");

export const FAMILY_COLOR = {
  Boletaceae: M.gold,
  Amanitaceae: M.rose,
  Suillaceae: M.sky,
  Thelephoraceae: M.taupe,
  Tricholomataceae: M.sand,
  Russulaceae: M.slate,
  Phallaceae: M.mauve,
  Agaricaceae: M.olive,
};
export const OTHER_COLOR = "#bdbdb6";

export const familyColor = (f) => FAMILY_COLOR[f] || OTHER_COLOR;

export const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const PEAK = [6, 7, 8, 9];

export const prefName = new Map(
  prefectures.features.map((f) => [
    f.properties.adcode,
    { en: f.properties.name_en, zh: f.properties.name_zh },
  ]),
);
export const countyName = new Map(counties.map((c) => [c.id, c]));

export const fmt = (n) => n.toLocaleString("en-US");
