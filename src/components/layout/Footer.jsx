import storyboard9 from "../../images/storyboard9.jpg";
import gbifLogo from "../../images/logo-gbif.svg";
import ccdcwLogo from "../../images/logo-ccdcw.png";

const I = ({ children }) => <i>{children}</i>;
const Doi = ({ id }) => (
  <a href={`https://doi.org/${id}`} target="_blank" rel="noreferrer">
    https://doi.org/{id}
  </a>
);

export default function Footer() {
  return (
    <footer className="site-foot-wrap">
      <img src={storyboard9} alt="Storyboard 9" className="site-foot-art" />
      <div className="site-foot">
        <div className="foot-inner">
          <section className="foot-sources" aria-label="Data sources">
            <h3>Data sources</h3>
            <div className="foot-source-row">
              <a className="foot-logo foot-logo--gbif" href="https://www.gbif.org" target="_blank" rel="noreferrer">
                <img src={gbifLogo} alt="GBIF, the Global Biodiversity Information Facility" />
              </a>
              <p>
                <b>GBIF</b> occurrence records for Yunnan Province, 2010–2026 (1,188 records after screening), retrieved 12 November 2026.
              </p>
            </div>
            <div className="foot-source-row">
              <a className="foot-logo foot-logo--ccdcw" href="https://weekly.chinacdc.cn" target="_blank" rel="noreferrer">
                <img src={ccdcwLogo} alt="China CDC Weekly" />
              </a>
              <p>
                <b>China CDC Weekly</b> annual reports on mushroom poisoning outbreaks, 2019–2025.
              </p>
            </div>
            <div className="foot-source-row">
              <a className="foot-logo foot-logo--tag" href="https://github.com/BigDataQiChao/GeoMapData_CN" target="_blank" rel="noreferrer">
                GeoJSON
              </a>
              <p>
                China administrative boundaries from{" "}
                <a href="https://github.com/BigDataQiChao/GeoMapData_CN" target="_blank" rel="noreferrer">
                  BigDataQiChao/GeoMapData_CN
                </a>
                .
              </p>
            </div>
          </section>

          <section className="foot-refs" aria-label="References">
            <h3>References</h3>
            <ol>
              <li>
                Wu, F., Zhou, L.-W., Yang, Z.-L., Bau, T., Li, T.-H., &amp; Dai, Y.-C. (2019). Resource diversity of Chinese macrofungi: Edible, medicinal and poisonous species. <I>Fungal Diversity, 98</I>(1), 1–76. <Doi id="10.1007/s13225-019-00432-7" />
              </li>
              <li>
                Zhang, Y., Mo, M., Yang, L., Mi, F., Cao, Y., Liu, C., Tang, X., Wang, P., &amp; Xu, J. (2021). Exploring the species diversity of edible mushrooms in Yunnan, Southwestern China, by DNA barcoding. <I>Journal of Fungi, 7</I>(4), Article 310. <Doi id="10.3390/jof7040310" />
              </li>
            </ol>
          </section>
        </div>
      </div>
    </footer>
  );
}
