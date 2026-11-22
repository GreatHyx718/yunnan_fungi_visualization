import { pinyin } from "pinyin-pro";

// Names used in the text for counties whose pinyin would be long or unusual.
const DISPLAY = {
  "\u7389\u9f99\u7eb3\u897f\u65cf\u81ea\u6cbb\u53bf": "Yulong",
  "\u9999\u683c\u91cc\u62c9\u5e02": "Shangri-La",
};

// County names in the data are Chinese; show them as pinyin (e.g. "Mengla").
export const toEnglishName = (chineseName) => {
  if (DISPLAY[chineseName]) return DISPLAY[chineseName];
  const clean = chineseName.replace(/[\u53bf\u533a\u5e02]/g, "");
  const s = pinyin(clean, { toneType: "none", type: "array" }).join("");
  return s.charAt(0).toUpperCase() + s.slice(1);
};
