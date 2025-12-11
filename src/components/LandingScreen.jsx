import { useState, useEffect } from "react";
import { FaCloudBolt, FaCalculator, FaCircleInfo } from "react-icons/fa6";
import "./LandingScreen.css";

const ButtonCard = ({
  // eslint-disable-next-line no-unused-vars
  icon: Icon,
  title,
  onClick,
  variant,
  buttonsAnimated,
}) => {
  return (
    <button
      className={`landing-button ${variant} ${
        buttonsAnimated ? "animated" : ""
      }`}
      onClick={onClick}
    >
      <div className="landing-button-icon">
        <Icon />
      </div>
      <span className="landing-button-text">{title}</span>
    </button>
  );
};

export default function LandingScreen({
  onFilePower,
  onFormulasPower,
  onAbout,
}) {
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);
  useEffect(() => {
    document.title = "Grid Power";
  }, []);
  useEffect(() => {
    const rafId = requestAnimationFrame(() => setLogoAnimated(true));
    const timer = setTimeout(() => setButtonsAnimated(true), 100);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="landing-container">
      <div
        className={`landing-logo-container ${logoAnimated ? "animated" : ""}`}
      >
        <div className="landing-logo">
          <FaCloudBolt />
        </div>
        <h1 className="landing-title">Welcome</h1>
      </div>

      <div className="landing-button-grid">
        <ButtonCard
          icon={FaCalculator}
          title="P & I Tools"
          onClick={onFormulasPower}
          variant="formulas"
          buttonsAnimated={buttonsAnimated}
        />
        <ButtonCard
          icon={FaCloudBolt}
          title="File Power"
          onClick={onFilePower}
          variant="file-power"
          buttonsAnimated={buttonsAnimated}
        />
      </div>

      <div
        className={`landing-about-container ${
          buttonsAnimated ? "animated" : ""
        }`}
      >
        <button className="about-link-button" onClick={onAbout}>
          <FaCircleInfo className="about-icon" />
          <span>About</span>
        </button>
      </div>

      <div className="landing-footer">
        <div className="decorative-line"></div>
      </div>
    </div>
  );
}
