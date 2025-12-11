import { useState } from "react";
import { FaArrowLeft, FaClipboard } from "react-icons/fa6";
import { useToast } from "../Toast";
import "./Calculator.css";

export default function MicomRelayThermalOverload({ onBack }) {
  const [thermalTimeConstant, setThermalTimeConstant] = useState("");
  const [appliedCurrent, setAppliedCurrent] = useState("");
  const [iTheta, setITheta] = useState("");
  const [k, setK] = useState("");
  const [rcaPresentThermalState, setRcaPresentThermalState] = useState("");
  const [thetaTrip, setThetaTrip] = useState("");
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({
    thermal: false,
    applied: false,
    iTheta: false,
    k: false,
    rca: false,
    thetaTrip: false,
  });

  const { showToast } = useToast();

  const calculateThermalOverload = () => {
    const fields = [
      { key: "thermal", value: thermalTimeConstant },
      { key: "applied", value: appliedCurrent },
      { key: "iTheta", value: iTheta },
      { key: "k", value: k },
      { key: "rca", value: rcaPresentThermalState },
      { key: "thetaTrip", value: thetaTrip },
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

    const T = parseFloat(thermalTimeConstant);
    const I = parseFloat(appliedCurrent);
    const ITheta = parseFloat(iTheta);
    const K_val = parseFloat(k);
    const theta = parseFloat(rcaPresentThermalState);
    const thetaTripVal = parseFloat(thetaTrip);

    if (
      isNaN(T) ||
      isNaN(I) ||
      isNaN(ITheta) ||
      isNaN(K_val) ||
      isNaN(theta) ||
      isNaN(thetaTripVal)
    ) {
      setResult("Please enter valid numbers for all fields.");
      return;
    }

    if (ITheta === 0 || K_val === 0) {
      setResult("Setting Current (I Theta) and K cannot be zero.");
      return;
    }

    // Time = T * (ln(|(I/(k*ITheta))^2 - rca|) - ln(|(I/(k*ITheta))^2 - thetaTrip|))
    const kITheta = K_val * ITheta;
    const ratio = I / kITheta;
    const ratioSquared = Math.pow(ratio, 2);

    const numerator = Math.abs(ratioSquared - theta);
    const denominator = Math.abs(ratioSquared - thetaTripVal);

    if (denominator === 0 || numerator === 0) {
      setResult("Invalid calculation: Check values.");
      return;
    }

    const time = T * Math.log(numerator / denominator);

    if (isNaN(time) || !isFinite(time)) {
      setResult("Invalid calculation result.");
      return;
    }

    setResult(`${time.toFixed(4)} s`);
  };

  const resetForm = () => {
    setThermalTimeConstant("");
    setAppliedCurrent("");
    setITheta("");
    setK("");
    setRcaPresentThermalState("");
    setThetaTrip("");
    setResult(null);
    setErrors({
      thermal: false,
      applied: false,
      iTheta: false,
      k: false,
      rca: false,
      thetaTrip: false,
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
          <h1 className="calculator-title">Micom Relay Thermal Overload</h1>
          <div className="calculator-header-spacer"></div>
        </div>
      </div>

      <div className="calculator-content">
        <div className="calc-input-group">
          <label className={`calc-label ${errors.thermal ? "error" : ""}`}>
            Thermal Time Constant (T)
          </label>
          <input
            type="number"
            className={`calc-input ${errors.thermal ? "error" : ""}`}
            placeholder="Enter Thermal Time Constant"
            value={thermalTimeConstant}
            onChange={updateField(setThermalTimeConstant, "thermal")}
          />
        </div>

        <div className="calc-input-group">
          <label className={`calc-label ${errors.applied ? "error" : ""}`}>
            Applied Current (I)
          </label>
          <input
            type="number"
            className={`calc-input ${errors.applied ? "error" : ""}`}
            placeholder="Enter Applied Current"
            value={appliedCurrent}
            onChange={updateField(setAppliedCurrent, "applied")}
          />
        </div>

        <div className="calc-input-group">
          <label className={`calc-label ${errors.iTheta ? "error" : ""}`}>
            I Theta (Setting Current)
          </label>
          <input
            type="number"
            className={`calc-input ${errors.iTheta ? "error" : ""}`}
            placeholder="Enter Setting Current"
            value={iTheta}
            onChange={updateField(setITheta, "iTheta")}
          />
        </div>

        <div className="calc-input-group">
          <label className={`calc-label ${errors.k ? "error" : ""}`}>K</label>
          <input
            type="number"
            className={`calc-input ${errors.k ? "error" : ""}`}
            placeholder="Enter K"
            value={k}
            onChange={updateField(setK, "k")}
          />
        </div>

        <div className="calc-input-group">
          <label className={`calc-label ${errors.rca ? "error" : ""}`}>
            RCA Present Thermal State (θ)
          </label>
          <input
            type="number"
            className={`calc-input ${errors.rca ? "error" : ""}`}
            placeholder="Percentage of Heating"
            value={rcaPresentThermalState}
            onChange={updateField(setRcaPresentThermalState, "rca")}
          />
        </div>

        <div className="calc-input-group">
          <label className={`calc-label ${errors.thetaTrip ? "error" : ""}`}>
            Theta Trip (θtrip)
          </label>
          <input
            type="number"
            className={`calc-input ${errors.thetaTrip ? "error" : ""}`}
            placeholder="Enter Theta Trip"
            value={thetaTrip}
            onChange={updateField(setThetaTrip, "thetaTrip")}
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
