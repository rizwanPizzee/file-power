import { useState } from "react";
import { FaArrowLeft, FaClipboard } from "react-icons/fa6";
import { useToast } from "../Toast";
import "./Calculator.css";

export default function SiemensRelayThermalOverload({ onBack }) {
  const [timeConstant, setTimeConstant] = useState("");
  const [appliedCurrent, setAppliedCurrent] = useState("");
  const [settingCurrent, setSettingCurrent] = useState("");
  const [k, setK] = useState("");
  const [preloadCurrent, setPreloadCurrent] = useState("");
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({
    timeConstant: false,
    applied: false,
    setting: false,
    k: false,
    preload: false,
  });

  const { showToast } = useToast();

  const calculateThermalOverload = () => {
    const fields = [
      { key: "timeConstant", value: timeConstant },
      { key: "applied", value: appliedCurrent },
      { key: "setting", value: settingCurrent },
      { key: "k", value: k },
      { key: "preload", value: preloadCurrent },
    ];

    const newErrors = {};
    let hasError = false;
    fields.forEach(({ key, value }) => {
      if (!value || value.trim() === "") {
        newErrors[key] = true;
        hasError = true;
      } else {
        newErrors[key] = false;
      }
    });

    setErrors(newErrors);

    if (hasError) {
      setResult(null);
      return;
    }

    const Tth = parseFloat(timeConstant);
    const Iactual = parseFloat(appliedCurrent);
    const Inorm = parseFloat(settingCurrent);
    const K_val = parseFloat(k);
    const Ipre = parseFloat(preloadCurrent);

    if (
      isNaN(Tth) ||
      isNaN(Iactual) ||
      isNaN(Inorm) ||
      isNaN(K_val) ||
      isNaN(Ipre)
    ) {
      setResult("Please enter valid numbers for all fields.");
      return;
    }

    if (Inorm === 0 || K_val === 0) {
      setResult("Setting Current and K cannot be zero.");
      return;
    }

    // Formula: t = Tth * ln(((Iactual/(k*Inorm))^2 - (Ipre/(k*Inorm))^2) / ((Iactual/(k*Inorm))^2 - 1))
    const kInorm = K_val * Inorm;
    const actualRatio = Iactual / kInorm;
    const preRatio = Ipre / kInorm;

    const actualRatioSquared = Math.pow(actualRatio, 2);
    const preRatioSquared = Math.pow(preRatio, 2);

    const numerator = actualRatioSquared - preRatioSquared;
    const denominator = actualRatioSquared - 1;

    if (denominator === 0 || numerator <= 0 || denominator <= 0) {
      setResult("Error: Check Values.");
      return;
    }

    const time = Tth * Math.log(numerator / denominator);

    if (isNaN(time) || !isFinite(time)) {
      setResult("Invalid calculation result.");
      return;
    }

    setResult(`${time.toFixed(4)} s`);
  };

  const resetForm = () => {
    setTimeConstant("");
    setAppliedCurrent("");
    setSettingCurrent("");
    setK("");
    setPreloadCurrent("");
    setResult(null);
    setErrors({
      timeConstant: false,
      applied: false,
      setting: false,
      k: false,
      preload: false,
    });
  };

  const copyToClipboard = async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
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
          <h1 className="calculator-title">Siemens Relay Thermal Overload</h1>
          <div className="calculator-header-spacer"></div>
        </div>
      </div>

      <div className="calculator-content">
        <div className="calc-input-group">
          <label className={`calc-label ${errors.timeConstant ? "error" : ""}`}>
            Time Constant (Tth)
          </label>
          <input
            type="number"
            className={`calc-input ${errors.timeConstant ? "error" : ""}`}
            placeholder="Setting value in seconds"
            value={timeConstant}
            onChange={updateField(setTimeConstant, "timeConstant")}
          />
        </div>

        <div className="calc-input-group">
          <label className={`calc-label ${errors.applied ? "error" : ""}`}>
            Applied Current (I)
          </label>
          <input
            type="number"
            className={`calc-input ${errors.applied ? "error" : ""}`}
            placeholder="Test current in Ampere"
            value={appliedCurrent}
            onChange={updateField(setAppliedCurrent, "applied")}
          />
        </div>

        <div className="calc-input-group">
          <label className={`calc-label ${errors.setting ? "error" : ""}`}>
            I rated.object (Setting Current)
          </label>
          <input
            type="number"
            className={`calc-input ${errors.setting ? "error" : ""}`}
            placeholder="Setting value in Ampere"
            value={settingCurrent}
            onChange={updateField(setSettingCurrent, "setting")}
          />
        </div>

        <div className="calc-input-group">
          <label className={`calc-label ${errors.k ? "error" : ""}`}>K</label>
          <input
            type="number"
            className={`calc-input ${errors.k ? "error" : ""}`}
            placeholder="Setting value of K"
            value={k}
            onChange={updateField(setK, "k")}
          />
        </div>

        <div className="calc-input-group">
          <label className={`calc-label ${errors.preload ? "error" : ""}`}>
            I preload Memory Current
          </label>
          <input
            type="number"
            className={`calc-input ${errors.preload ? "error" : ""}`}
            placeholder="Percentage of Heating"
            value={preloadCurrent}
            onChange={updateField(setPreloadCurrent, "preload")}
          />
        </div>

        <div className="calc-button-row">
          <button
            className="calc-btn primary"
            onClick={calculateThermalOverload}
          >
            Calculate
          </button>
          <button className="calc-btn reset" onClick={resetForm}>
            Reset
          </button>
        </div>

        {result !== null && (
          <div className="calc-result-container">
            <div className="calc-result-row">
              <span className="calc-result-value">{result}</span>
              <button className="calc-copy-btn" onClick={copyToClipboard}>
                <FaClipboard />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
