// Dunhuang earth palette for the treemap.
// Ranks are positions in a month's list (largest family = Rank 1). The same rank always gets
// the same colour in every month. "Other" is not a rank and always has its own fixed colour.

// Same 14 Dunhuang colours, ordered so that neighbouring ranks alternate between dark/light and
// warm/cool (dark brown, teal, orange, red-brown, sage, rust, cream ...). Large tiles that sit next
// to each other (ranks 1 to 6) are therefore easy to tell apart.
export const DUNHUANG_RANKS = [
  "#432714", // Rank 1  dark brown
  "#6BB0A0", // Rank 2  teal
  "#DD9650", // Rank 3  orange
  "#813A1B", // Rank 4  red-brown
  "#98BFA7", // Rank 5  sage green
  "#BF5825", // Rank 6  rust
  "#DDC69B", // Rank 7  cream
  "#683218", // Rank 8  brown
  "#E0B26F", // Rank 9  sand gold
  "#A14924", // Rank 10 terracotta
  "#CC6B32", // Rank 11 ochre orange
  "#542B16", // Rank 12 deep brown
  "#D98743", // Rank 13 amber
  "#A34524", // Rank 14 brick
];

export const DUNHUANG_OTHER = "#D2D9E5";

// warm off-white chart background, gap/outline colour between tiles, and text colours
export const TREEMAP_BG = "#FBF6EC";
export const TREEMAP_GAP = "#FBF6EC";
export const TREEMAP_TEXT_DARK = "#2B1A10";
export const TREEMAP_TEXT_LIGHT = "#FFFFFF";

/**
 * Colour for each non-Other item of one month, by rank within that month.
 * `items` must already be sorted from largest to smallest (Other excluded).
 * If a month ever has more families than colours, the extra ranks reuse the last colour.
 * Returns a Map from item name to hex colour.
 */
export function rankColors(items) {
  const map = new Map();
  items.forEach((item, i) => map.set(item.name, DUNHUANG_RANKS[Math.min(i, DUNHUANG_RANKS.length - 1)]));
  return map;
}

const channel = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Text colour (light or dark) with the better contrast on the given tile colour. */
export function textOn(hex) {
  return contrast(hex, TREEMAP_TEXT_LIGHT) >= contrast(hex, TREEMAP_TEXT_DARK) ? TREEMAP_TEXT_LIGHT : TREEMAP_TEXT_DARK;
}
