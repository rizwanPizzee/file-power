import { useState, useRef } from "react";
import { FaArrowLeft, FaClipboard } from "react-icons/fa6";
import { useToast } from "../Toast";
import "./Calculator.css";

export default function StandardInverseOvercurrent({ onBack }) {
  const [pickupCurrent, setPickupCurrent] = useState("");
  const [timeDial, setTimeDial] = useState("");
  const [appliedCurrent, setAppliedCurrent] = useState("");
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({
    pickup: false,
    timeDial: false,
    applied: false,
  });

  const { showToast } = useToast();
  const pickupRef = useRef(null);
  const timeDialRef = useRef(null);
  const appliedRef = useRef(null);

  const calculateTime = () => {
    const newErrors = {
      pickup: !pickupCurrent || pickupCurrent.trim() === "",
      timeDial: !timeDial || timeDial.trim() === "",
      applied: !appliedCurrent || appliedCurrent.trim() === "",
    };

    setErrors(newErrors);

    if (newErrors.pickup || newErrors.timeDial || newErrors.applied) {
      setResult(null);
      if (newErrors.pickup) pickupRef.current?.focus();
      else if (newErrors.timeDial) timeDialRef.current?.focus();
      else if (newErrors.applied) appliedRef.current?.focus();
      return;
    }

    const Ip = parseFloat(pickupCurrent);
    const Tp = parseFloat(timeDial);
    const I = parseFloat(appliedCurrent);

    if (isNaN(Ip) || isNaN(Tp) || isNaN(I)) {
      setResult("Please enter valid numbers for all fields.");
      return;
    }

    const ratio = I / Ip;
    // Formula: t = Tp * ((0.14 / ((I / Ip)^0.02 - 1)) + 0.01)
    const time = Tp * (0.14 / (Math.pow(ratio, 0.02) - 1) + 0.01);

    setResult(`${time.toFixed(4)} sec`);
  };

  const resetForm = () => {
    setPickupCurrent("");
    setTimeDial("");
    setAppliedCurrent("");
    setResult(null);
    setErrors({ pickup: false, timeDial: false, applied: false });
  };

  const copyToClipboard = async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      showToast("Copied", "Result copied to clipboard");
    }
  };

  const handleKeyDown = (e, nextRef) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef) {
        nextRef.current?.focus();
      } else {
        calculateTime();
      }
    }
  };

  return (
    <div className="calculator-container">
      <div className="calculator-header">
        <div className="calculator-header-content">
          <button className="back-btn" onClick={onBack}>
            <FaArrowLeft />
          </button>
          <h1 className="calculator-title">Standard Inverse Overcurrent</h1>
          <div className="calculator-header-spacer"></div>
        </div>
      </div>

      <div className="calculator-content">
        <div className="calc-input-group">
          <label className={`calc-label ${errors.pickup ? "error" : ""}`}>
            Pickup Current (Ip)
          </label>
          <input
            ref={pickupRef}
            type="number"
            className={`calc-input ${errors.pickup ? "error" : ""}`}
            placeholder="Enter Pickup Current"
            value={pickupCurrent}
            onChange={(e) => {
              setPickupCurrent(e.target.value);
              if (e.target.value)
                setErrors((prev) => ({ ...prev, pickup: false }));
            }}
            onKeyDown={(e) => handleKeyDown(e, timeDialRef)}
          />
        </div>

        <div className="calc-input-group">
          <label className={`calc-label ${errors.timeDial ? "error" : ""}`}>
            Time Dial Settings (Tp)
          </label>
          <input
            ref={timeDialRef}
            type="number"
            className={`calc-input ${errors.timeDial ? "error" : ""}`}
            placeholder="Enter Time Dial"
            value={timeDial}
            onChange={(e) => {
              setTimeDial(e.target.value);
              if (e.target.value)
                setErrors((prev) => ({ ...prev, timeDial: false }));
            }}
            onKeyDown={(e) => handleKeyDown(e, appliedRef)}
          />
        </div>

        <div className="calc-input-group">
          <label className={`calc-label ${errors.applied ? "error" : ""}`}>
            Applied Current (I)
          </label>
          <input
            ref={appliedRef}
            type="number"
            className={`calc-input ${errors.applied ? "error" : ""}`}
            placeholder="Enter Applied Current"
            value={appliedCurrent}
            onChange={(e) => {
              setAppliedCurrent(e.target.value);
              if (e.target.value)
                setErrors((prev) => ({ ...prev, applied: false }));
            }}
            onKeyDown={(e) => handleKeyDown(e, null)}
          />
        </div>

        <div className="calc-button-row">
          <button className="calc-btn primary" onClick={calculateTime}>
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
