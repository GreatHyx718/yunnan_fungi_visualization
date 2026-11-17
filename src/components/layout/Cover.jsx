import titleImg from "../../images/title.png";
import subtitleImg from "../../images/subtitle.png";
import bgImg from "../../images/title_page.jpg";

export default function Cover() {
  return (
    <div className="cover">
      <header className="masthead" id="top">
        <div className="masthead-stage" style={{ backgroundImage: `url(${bgImg})` }}>
          <img src={titleImg} alt="A Record of Mushroom Foraging in Yunnan" className="title-img" />
          <img src={subtitleImg} alt="Delicious, Dangerous, and a Little Magical" className="subtitle-img" />
          <div className="authors">
            <p>Siyuan Dong, Yujie Zhang, and Yuxuan Huang</p>
            <p className="affiliation">City University of Hong Kong</p>
          </div>
        </div>
      </header>
    </div>
  );
}
