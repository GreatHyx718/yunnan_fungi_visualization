import Cover from "./components/layout/Cover.jsx";
import Sunburst from "./components/sections/HierarchyNetwork.jsx";
import BubbleMap from "./components/sections/BubbleMap.jsx";
import MonthBars from "./components/sections/MonthBars.jsx";
import Treemaps from "./components/sections/Treemaps.jsx";
import Top5 from "./components/sections/Top5.jsx";
import FamilyCards from "./components/sections/FamilyCards.jsx";
import Hotspots from "./components/sections/Hotspots.jsx";
import Amanita from "./components/sections/Amanita.jsx";
import Poison from "./components/sections/Poison.jsx";

export default function App() {
  return (
    <>
      <Cover />
      <main>
        <Sunburst />
        <BubbleMap />
        <MonthBars />
        <Treemaps />
        <Top5 />
        <FamilyCards />
        <Hotspots />
        <Amanita />
        <Poison />
      </main>
      <footer className="site-foot">
        Data: GBIF occurrences for Yunnan 2010–2026 (1,188 records), Wu 2019 and Zhang 2021 edible-species tables, China CDC Weekly poisoning reports, SRTM 90 m elevation.
        <span className="zh" lang="zh-Hans">观测 ≠ 实际分布 · 观测 ≠ 可食用</span>
      </footer>
    </>
  );
}
