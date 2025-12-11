import { useState, useEffect } from "react";
import { FaCloudBolt, FaCalculator } from "react-icons/fa6";
import "./LandingScreen.css";

/**
 * ButtonCard declared outside LandingScreen to avoid creating a component during render.
 * It receives buttonsAnimated so it doesn't rely on outer closure.
 */
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

export default function LandingScreen({ onFilePower, onFormulasPower }) {
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);

  useEffect(() => {
    // Make the logo animation state update async so we don't synchronously call setState inside effect
    // requestAnimationFrame runs before paint; it's a common pattern for "start animation after mount"
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

      <div className="landing-footer">
        <div className="decorative-line"></div>
      </div>
    </div>
  );
}
