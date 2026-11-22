import { useEffect, useRef } from "react";
import Cover from "./components/layout/Cover.jsx";
import storyboard1 from "./images/storyboard1.jpg";
import storyboard2 from "./images/storyboard2.jpg";
import storyboard3 from "./images/storyboard3.jpg";
import storyboard4 from "./images/storyboard4.jpg";
import storyboard5 from "./images/storyboard5.jpg";
import storyboard6 from "./images/storyboard6.jpg";
import storyboard7 from "./images/storyboard7.jpg";
import storyboard8 from "./images/storyboard8.jpg";
import storyboard9 from "./images/storyboard9.jpg";
import Sunburst from "./components/sections/HierarchyNetwork.jsx";
import BubbleMap from "./components/sections/BubbleMap.jsx";
import MonthBars from "./components/sections/MonthBars.jsx";
import Treemaps from "./components/sections/Treemaps.jsx";
import FamilyCards from "./components/sections/FamilyCards.jsx";
import Hotspots from "./components/sections/Hotspots.jsx";
import Amanita from "./components/sections/Amanita.jsx";
import Poison from "./components/sections/Poison.jsx";

// Blur band over the cover/storyboard seam: no blur at the top of the page, full blur after
// the reader has scrolled about a third of a screen.
function SeamBlur() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const update = () => {
      const t = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.35)));
      const v = t === 0 ? "none" : `blur(${(t * 20).toFixed(1)}px)`;
      el.style.backdropFilter = v;
      el.style.webkitBackdropFilter = v;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return <div ref={ref} className="seam-blur" aria-hidden="true" />;
}

const Storyboard = ({ src, n }) => (
  <img src={src} alt={`Storyboard ${n}`} style={{ display: "block", width: "100%", height: "auto" }} />
);

export default function App() {
  return (
    <>
      <Cover />
      <SeamBlur />
      <Storyboard src={storyboard1} n={1} />
      <main>
        <Sunburst />
        <Storyboard src={storyboard2} n={2} />
        <BubbleMap />
        <Storyboard src={storyboard3} n={3} />
        <MonthBars />
        <Storyboard src={storyboard4} n={4} />
        <Treemaps />
        <Storyboard src={storyboard5} n={5} />
        <FamilyCards />
        <Storyboard src={storyboard6} n={6} />
        <Hotspots />
        <Storyboard src={storyboard7} n={7} />
        <Amanita />
        <Storyboard src={storyboard8} n={8} />
        <Poison />
        <div className="seam-blur seam-blur--static" aria-hidden="true" />
        <Storyboard src={storyboard9} n={9} />
      </main>
      <footer className="site-foot site-foot--overlay">
        Data: GBIF occurrences for Yunnan 2010–2026 (1,188 records), Wu 2019 and Zhang 2021 edible-species tables, China CDC Weekly poisoning reports, SRTM 90 m elevation.
      </footer>
    </>
  );
}
