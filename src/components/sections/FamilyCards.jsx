import { useEffect, useMemo, useRef, useState } from "react";
import { C, FAMILY_ZH, MONTH_ABBR, familyColor, prefName, records } from "../../utils/theme.js";
import { Badge, Bi, Step, Tabs, Tag } from "../../utils/ui.jsx";
import { MONTH_NAME, byMonth } from "./Top5.jsx";
import boletusImage from "../../images/boletus-sinoedulis-single中华美味牛肝菌（白牛肝） 1.png";
import rubroboletusImage from "../../images/Rubroboletus sinicus中华红孔牛肝菌（红见手） 1.png";
import agaricusImage from "../../images/agaricus-campestris-3mushrooms四孢蘑菇 1.png";
import amanitaHemibaphaImage from "../../images/amanita-hemibapha-v2半色彩鹅膏（鸡蛋菌） 1.png";
import amanitaOchraceaImage from "../../images/amanita-ochracea赭色鹅膏 1.png";
import helvellaImage from "../../images/helvella-crispa皱马鞍菌（白马鞍） 1.png";
import lycoperdaceaeImage from "../../images/lycoperdaceae-puffball马勃科 1.png";
import phallusImage from "../../images/phallus-indusiatus-pencil长裙竹荪 1.png";
import russulaImage from "../../images/russulaceae-russula红菇科 1.png";
import schizophyllumImage from "../../images/schizophyllum-balanced裂褶菌 1.png";
import suillusImage from "../../images/suillus-brunneissimus-v2褐乳牛肝菌（荞面菌） 1.png";
import thelephoraImage from "../../images/thelephora-ganbajun-bright干巴革菌（干巴菌） 1.png";
import tricholomaImage from "../../images/tricholoma-matsutake-v2松口蘑（松茸） 1.png";
import physalacriaceaeImage from "../../images/physalacriaceae-ramaria 1.png";
import coprinusImage from "../../images/coprinus-comatus毛头鬼伞 1.png";

const FAMILY_CARD_MONTHS = [6, 7, 8, 9, 10];
const monthEdible = Object.fromEntries(FAMILY_CARD_MONTHS.map((m) => [m, records.filter((r) => r.m === m && r.ed).length]));
const MONTH_IMAGES = {
  6: [
    { family: "Boletaceae", src: boletusImage, size: "large" },
    { family: "Agaricaceae", src: agaricusImage, size: "medium" },
    { family: "Phallaceae", src: phallusImage, size: "medium" },
    { family: "Schizophyllaceae", src: schizophyllumImage, size: "small" },
    { family: "Lycoperdaceae", src: lycoperdaceaeImage, size: "small" },
  ],
  7: [
    { family: "Boletaceae", src: rubroboletusImage, size: "large" },
    { family: "Thelephoraceae", src: thelephoraImage, size: "medium" },
    { family: "Amanitaceae", src: amanitaHemibaphaImage, size: "medium" },
    { family: "Russulaceae", src: russulaImage, size: "small" },
    { family: "Tricholomataceae", src: tricholomaImage, size: "medium" },
  ],
  8: [
    { family: "Boletaceae", src: rubroboletusImage, size: "large" },
    { family: "Amanitaceae", src: amanitaOchraceaImage, size: "medium" },
    { family: "Suillaceae", src: suillusImage, size: "medium" },
    { family: "Thelephoraceae", src: thelephoraImage, size: "small" },
    { family: "Tricholomataceae", src: tricholomaImage, size: "medium" },
  ],
  9: [
    { family: "Boletaceae", src: boletusImage, size: "large" },
    { family: "Thelephoraceae", src: thelephoraImage, size: "medium" },
    { family: "Helvellaceae", src: helvellaImage, size: "small" },
    { family: "Amanitaceae", src: amanitaHemibaphaImage, size: "medium" },
    { family: "Suillaceae", src: suillusImage, size: "medium" },
  ],
  10: [
    { family: "Agaricaceae", src: coprinusImage, size: "large" },
    { family: "Physalacriaceae", src: physalacriaceaeImage, size: "medium" },
    { family: "Lycoperdaceae", src: lycoperdaceaeImage, size: "medium" },
    { family: "Thelephoraceae", src: thelephoraImage, size: "small" },
    { family: "Schizophyllaceae", src: schizophyllumImage, size: "medium" },
  ],
};

function familyStats(family) {
  const all = records.filter((r) => r.fa === family);
  const ed = all.filter((r) => r.ed);
  const perMonth = FAMILY_CARD_MONTHS.map((m) => ed.filter((r) => r.m === m).length);
  const coord = ed.filter((r) => r.pf != null);
  const prefs = new Map();
  for (const r of coord) prefs.set(r.pf, (prefs.get(r.pf) || 0) + 1);
  const top3 = [...prefs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const dem = coord.map((r) => r.el).filter((v) => v != null).sort((a, b) => a - b);
  return {
    all: all.length,
    edible: ed.length,
    notEdible: all.length - ed.length,
    flagged: ed.filter((r) => r.ed === 2).length,
    perMonth,
    coord: coord.length,
    top3,
    dem,
    species: new Set(all.map((r) => r.sp).filter(Boolean)).size,
  };
}

function MonthMini({ values, totals }) {
  const max = Math.max(...values, 1);
  // Calculate actual bar heights and ensure no overlap
  const barHeights = values.map((v) => (v / max) * 52 + (v ? 2 : 0));
  const minGap = 3; // minimum gap between bars to prevent visual overlap
  
  // Adjust heights if they would cause overlap issues
  const maxAllowedHeight = 52;
  const adjustedHeights = barHeights.map((h) => Math.min(h, maxAllowedHeight));
  
  return (
    <div className="mini-bars">
      {values.map((v, i) => (
        <div key={i} className="mini-col">
          <span className="mini-n">{v}</span>
          <i style={{ height: `${adjustedHeights[i]}px` }} />
          <span className="mini-m">{MONTH_ABBR[FAMILY_CARD_MONTHS[i] - 1]}</span>
          <span className="mini-share">{totals[i] ? `${((v / totals[i]) * 100).toFixed(0)}%` : "–"}</span>
        </div>
      ))}
    </div>
  );
}

function ElevationStrip({ dem }) {
  const lo = 0;
  const hi = 5200;
  if (!dem.length) return <p className="small">No coordinates, so no elevation estimate.</p>;
  const med = dem[Math.floor(dem.length / 2)];
  const x = (v) => ((v - lo) / (hi - lo)) * 100;
  return (
    <div className="elev">
      <div className="elev-track">
        {dem.map((v, i) => (
          <i key={i} className="elev-dot" style={{ left: `${x(v)}%` }} />
        ))}
        <b className="elev-med" style={{ left: `${x(med)}%` }} />
      </div>
      <div className="elev-axis">
        <span>0</span>
        <span>2,500</span>
        <span>5,000 m</span>
      </div>
      <p className="small">
        n = {dem.length}, median {Math.round(med)} m, range {Math.round(dem[0])}–{Math.round(dem[dem.length - 1])} m
      </p>
    </div>
  );
}

function Card({ family, month }) {
  const s = useMemo(() => familyStats(family), [family]);
  const totals = FAMILY_CARD_MONTHS.map((m) => monthEdible[m]);
  return (
    <article className="card" style={{ "--fam": familyColor(family) }}>
      <header>
        <h3>
          {family} <span className="zh">{FAMILY_ZH[family]}</span>
        </h3>
        <div className="tags">
          <Tag kind="edible">Edible range 可食用</Tag>
          {s.flagged ? <Tag kind="toxic">Includes poisonous flag 含有毒标记</Tag> : null}
          <Tag kind="family">{s.species} species</Tag>
        </div>
      </header>
      <div className="stats3">
        <div>
          <b>{s.all}</b>
          <span>All records 全部记录</span>
        </div>
        <div>
          <b>{s.edible}</b>
          <span>Edible range 可食记录</span>
        </div>
        <div>
          <b>{s.notEdible}</b>
          <span>Not edible range 不在可食范围</span>
        </div>
      </div>
      <h4>
        <Bi en="Edible records, Jun–Oct (and share of that month)" zh="6–10 月分布与月内占比" />
      </h4>
      <MonthMini values={s.perMonth} totals={totals} />
      <h4>
        <Bi en="Elevation" zh="海拔" /> <Badge kind="dem">DEM estimate ±200 m</Badge>
      </h4>
      <ElevationStrip dem={s.dem} />
      <h4>
        <Bi en="Top 3 prefectures (edible records, counts)" zh="记录最多的州市" />
      </h4>
      <ol className="top3">
        {s.top3.length ? (
          s.top3.map(([id, n]) => (
            <li key={id}>
              {prefName.get(id).en} <span className="zh">{prefName.get(id).zh}</span> <b>{n}</b>
            </li>
          ))
        ) : (
          <li>No coordinates</li>
        )}
      </ol>
    </article>
  );
}

function FamilyImageCollage({ month, activeFamily }) {
  const images = MONTH_IMAGES[month] || [];
  return (
    <div className={`family-art${images.length ? "" : " family-art--empty"}`} aria-label={`${MONTH_NAME[month]} mushroom illustrations`}>
      {images.map(({ family, src, size }) => (
        <div
          className={`family-art__bubble family-art__bubble--${size}${activeFamily === family ? " is-current" : ""}`}
          key={family}
        >
          <img src={src} alt="" />
        </div>
      ))}
    </div>
  );
}

export default function FamilyCards() {
  const [month, setMonth] = useState(8);
  const [idx, setIdx] = useState(0);
  const outer = useRef(null);
  const cardsBody = useRef(null);
  const [scrollSpan, setScrollSpan] = useState(0);
  const [manualControl, setManualControl] = useState(false);
  const rows = byMonth(month);

  useEffect(() => {
    const onScroll = () => {
      if (manualControl) return; // Don't update idx during tab changes
      const el = outer.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      if (span <= 0) return;
      const p = Math.min(0.9999, Math.max(0, -r.top / span));
      const newIdx = Math.floor(p * 5);
      setIdx(newIdx);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [month, manualControl]);

  useEffect(() => {
    const el = cardsBody.current;
    if (!el) return;
    const measure = () => {
      const height = el.getBoundingClientRect().height;
      // Increase scroll span for slower scrolling (more distance per card)
      setScrollSpan(Math.ceil(height * 6));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [month]);

  return (
    <section className="step cards-step" id="cards">
      <div ref={outer} className="cards-outer" style={scrollSpan ? { height: `calc(100vh + ${scrollSpan}px)` } : undefined}>
        <div className="cards-sticky">
          <div className="step-inner">
            <header className="step-head">
              <h2>
                <Bi en="Family cards" />
              </h2>
              <p className="sec-desc">
                Scroll to move through the five families of the chosen month, from rank 1 to rank 5. The illustration on the left follows the card.
              </p>
            </header>
            <Tabs
              value={month}
              onChange={(m) => {
                // Immediately disable scroll listener and reset idx
                setManualControl(true);
                setMonth(m);
                setIdx(0);
                // Scroll to the top of the cards section
                const section = document.getElementById("cards");
                if (section) {
                  const offsetTop = section.offsetTop;
                  window.scrollTo({ top: offsetTop, behavior: "smooth" });
                }
                // Re-enable scroll listener after scroll animation completes
                setTimeout(() => setManualControl(false), 800);
              }}
              options={FAMILY_CARD_MONTHS.map((m) => ({ value: m, label: `${MONTH_NAME[m].slice(0, 3)} (${byMonth(m)[0].monthTotal})` }))}
            />
            <div ref={cardsBody} className="cards-body">
              <FamilyImageCollage month={month} activeFamily={rows[idx].family} />
              <Card family={rows[idx].family} month={month} key={`${month}-${rows[idx].family}`} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { C };
