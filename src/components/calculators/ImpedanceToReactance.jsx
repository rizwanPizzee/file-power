import { useState } from "react";
import { FaArrowLeft, FaClipboard } from "react-icons/fa6";
import { useToast } from "../Toast";
import "./Calculator.css";

export default function ImpedanceToReactance({ onBack }) {
  const [z, setZ] = useState("");
  const [theta, setTheta] = useState("");
  const [unit, setUnit] = useState("deg"); // 'deg' | 'rad'
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({
    z: false,
    theta: false,
  });

  const { showToast } = useToast();

  const calculate = () => {
    const newErrors = {
      z: !z || z.trim() === "",
      theta: !theta || theta.trim() === "",
    };

    setErrors(newErrors);

    if (newErrors.z || newErrors.theta) {
      setResult(null);
      return;
    }

    const Z = parseFloat(z);
    const Th = parseFloat(theta);

    if (isNaN(Z) || isNaN(Th)) {
      setResult({ error: "Please enter valid numbers." });
      return;
    }

    let angleInRad = Th;
    if (unit === "deg") {
      angleInRad = (Th * Math.PI) / 180;
    }

    const R = Z * Math.cos(angleInRad);
    const X = Z * Math.sin(angleInRad);

    const sign = X >= 0 ? "+" : "-";
    const Xabs = Math.abs(X);

    setResult({
      R: R.toFixed(4),
      X: Xabs.toFixed(4),
      sign,
      rectangular: `${R.toFixed(4)} ${sign} ${Xabs.toFixed(4)} j`,
    });
  };

  const resetForm = () => {
    setZ("");
    setTheta("");
    setResult(null);
    setErrors({ z: false, theta: false });
  };

  const copyToClipboard = async () => {
    if (result && !result.error) {
      const text = `Resistance (R): ${result.R} Ω\nReactance (X): ${result.X} Ω\n\nRectangular form:\n${result.rectangular}`;
      await navigator.clipboard.writeText(text);
      showToast("Copied", "Result copied to clipboard");
    }
  };

  const updateField = (setter, key) => (e) => {
    setter(e.target.value);
    if (e.target.value) setErrors((prev) => ({ ...prev, [key]: false }));
  };

  return (
    <div className="calculator-container">
      <div className="calculator-header">
        <div className="calculator-header-content">
          <button className="back-btn" onClick={onBack}>
            <FaArrowLeft />
          </button>
          <h1 className="calculator-title">Impedance to Reactance</h1>
          <div className="calculator-header-spacer"></div>
        </div>
      </div>

      <div className="calculator-content">
        <div className="calc-input-group">
          <label className={`calc-label ${errors.z ? "error" : ""}`}>
            Impedance Magnitude (Z)
          </label>
          <input
            type="number"
            className={`calc-input ${errors.z ? "error" : ""}`}
            placeholder="Enter Impedance (Z)"
            value={z}
            onChange={updateField(setZ, "z")}
          />
        </div>

        <div className="calc-input-group">
          <label className={`calc-label ${errors.theta ? "error" : ""}`}>
            Angle (θ)
          </label>
          <input
            type="number"
            className={`calc-input ${errors.theta ? "error" : ""}`}
            placeholder="Enter Angle"
            value={theta}
            onChange={updateField(setTheta, "theta")}
          />
        </div>

        <div className="calc-input-group">
          <label className="calc-label">Angle Unit</label>
          <div className="unit-toggle">
            <button
              className={`unit-btn ${unit === "deg" ? "active" : ""}`}
              onClick={() => setUnit("deg")}
            >
              Degrees (°)
            </button>
            <button
              className={`unit-btn ${unit === "rad" ? "active" : ""}`}
              onClick={() => setUnit("rad")}
            >
              Radians (rad)
            </button>
          </div>
        </div>

        <div className="calc-button-row">
          <button className="calc-btn primary" onClick={calculate}>
            Calculate
          </button>
          <button className="calc-btn reset" onClick={resetForm}>
            Reset
          </button>
        </div>

        {result !== null && (
          <div className="calc-result-container">
            <div className="calc-result-row">
              {result.error ? (
                <span className="calc-result-value">{result.error}</span>
              ) : (
                <div className="calc-result-multiline">
                  <div>
                    <span className="label">Resistance (R): </span>
                    <span>{result.R} Ω</span>
                  </div>
                  <div>
                    <span className="label">Reactance (X): </span>
                    <span>{result.X} Ω</span>
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    <span className="label">Rectangular form:</span>
                  </div>
                  <div>{result.rectangular}</div>
                </div>
              )}
              {!result.error && (
                <button className="calc-copy-btn" onClick={copyToClipboard}>
                  <FaClipboard />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
