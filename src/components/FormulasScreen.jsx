import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import "./FormulasScreen.css";
import { useEffect } from "react";

const formulas = [
  {
    id: "standardInverse",
    title: "Standard Inverse Overcurrent",
    image: "/StandardInverseOvercurrent.png",
  },
  {
    id: "simensThermal",
    title: "Siemens Relay Thermal Overload",
    image: "/SimensRelayThermalOverload.png",
  },
  {
    id: "micomThermal",
    title: "Micom Relay Thermal Overload",
    image: "/MicomRelayThermalOverload.png",
  },
  {
    id: "impedanceToReactance",
    title: "Impedance to Reactance",
    image: "/ImpedanceToReactance.png",
  },
  {
    id: "siemensDiff7UT61X",
    title: "Siemens Diff 7UT61X",
    image: "/slope612.png",
    tall: true,
  },
  {
    id: "siemens7UT86Slope",
    title: "Siemens 7UT86 Slope",
    image: "/ut86.png",
    tall: true,
  },
];

export default function FormulasScreen({ onBack, onNavigate }) {
  useEffect(() => {
    document.title = "P & I Tools";
  }, []);
  return (
    <div className="formulas-container">
      <div className="formulas-header">
        <div className="header-content">
          <button className="back-btn" onClick={onBack}>
            <FaArrowLeft />
          </button>
          <h1 className="formulas-title">P & I Tools</h1>
          <div className="header-spacer"></div>
        </div>
      </div>

      <div className="formulas-grid">
        {formulas.map((formula) => (
          <button
            key={formula.id}
            className="formula-card"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              onNavigate(formula.id);
            }}
          >
            <div
              className={`formula-image-container ${
                formula.tall ? "tall" : ""
              }`}
            >
              <img
                src={formula.image}
                alt={formula.title}
                className="formula-image"
              />
            </div>
            <div className="formula-content">
              <h3 className="formula-name">{formula.title}</h3>
              <span className="formula-arrow">
                <FaArrowRight />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
