import { useState } from "react";
import {
  FaArrowLeft,
  FaClipboard,
  FaMagnifyingGlassMinus,
  FaMagnifyingGlassPlus,
  FaArrowsRotate,
} from "react-icons/fa6";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
} from "recharts";
import { useToast } from "../Toast";
import "./Calculator.css";

export default function SiemensDiff7UT61X({ onBack }) {
  const [pickup, setPickup] = useState("");
  const [slope1, setSlope1] = useState("");
  const [point1, setPoint1] = useState("");
  const [slope2, setSlope2] = useState("");
  const [point2, setPoint2] = useState("");
  const [highset, setHighset] = useState("");
  const [result, setResult] = useState(null);
  const [graphData, setGraphData] = useState([]);
  // const [zoomLevel, setZoomLevel] = useState(1);
  const [errors, setErrors] = useState({
    pickup: false,
    slope1: false,
    point1: false,
    slope2: false,
    point2: false,
    highset: false,
  });

  const { showToast } = useToast();

  const DEFAULT_ZOOM = 1;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2;
  const ZOOM_STEP = 0.25;

  // const handleZoomIn = () =>
  //   setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  // const handleZoomOut = () =>
  //   setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  // const handleZoomReset = () => setZoomLevel(DEFAULT_ZOOM);

  const calculateSlope = () => {
    const fields = [
      { key: "pickup", value: pickup },
      { key: "slope1", value: slope1 },
      { key: "point1", value: point1 },
      { key: "slope2", value: slope2 },
      { key: "point2", value: point2 },
      { key: "highset", value: highset },
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
      setGraphData([]);
      return;
    }

    const Pickup = parseFloat(pickup);
    const Slope1 = parseFloat(slope1);
    const Point1 = parseFloat(point1);
    const Slope2 = parseFloat(slope2);
    const Point2 = parseFloat(point2);
    const Highset = parseFloat(highset);

    if (
      isNaN(Pickup) ||
      isNaN(Slope1) ||
      isNaN(Point1) ||
      isNaN(Slope2) ||
      isNaN(Point2) ||
      isNaN(Highset)
    ) {
      setResult("Please enter valid numbers for all fields.");
      setGraphData([]);
      return;
    }

    // Calculate slope points based on 7UT61X formula
    const x0 = 0;
    const y0 = Pickup;
    const x1 = Pickup / Slope1 + Point1;
    const y1 = Pickup;
    const c1 = -Slope1 * Point1;
    const c2 = -Slope2 * Point2;
    const x2 = (c2 - c1) / (Slope1 - Slope2);
    const y2 = Slope1 * x2 + c1;
    const x3 = (Highset - y2) / Slope2 + x2;
    const y3 = Highset;

    const resultText = `(${x0.toFixed(2)}, ${y0.toFixed(2)}) (${x1.toFixed(
      2
    )}, ${y1.toFixed(2)}) (${x2.toFixed(2)}, ${y2.toFixed(2)}) (${x3.toFixed(
      2
    )}, ${y3.toFixed(2)})`;
    setResult(resultText);

    const data = [
      { x: x0, y: y0, label: `(${x0.toFixed(2)}, ${y0.toFixed(2)})` },
      { x: x1, y: y1, label: `(${x1.toFixed(2)}, ${y1.toFixed(2)})` },
      { x: x2, y: y2, label: `(${x2.toFixed(2)}, ${y2.toFixed(2)})` },
      { x: x3, y: y3, label: `(${x3.toFixed(2)}, ${y3.toFixed(2)})` },
    ];
    setGraphData(data);
  };

  const resetForm = () => {
    setPickup("");
    setSlope1("");
    setPoint1("");
    setSlope2("");
    setPoint2("");
    setHighset("");
    setResult(null);
    setGraphData([]);
    setErrors({
      pickup: false,
      slope1: false,
      point1: false,
      slope2: false,
      point2: false,
      highset: false,
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
          <h1 className="calculator-title">Siemens Diff 7UT61X</h1>
          <div className="calculator-header-spacer"></div>
        </div>
      </div>

      <div className="calculator-content">
        <div className="calc-input-group">
          <label className={`calc-label ${errors.pickup ? "error" : ""}`}>
            1221: Pickup Value of Differential Curr.
          </label>
          <input
            type="number"
            className={`calc-input ${errors.pickup ? "error" : ""}`}
            placeholder="Enter Setting values"
            value={pickup}
            onChange={updateField(setPickup, "pickup")}
          />
        </div>

        <div className="calc-input-group">
          <label className={`calc-label ${errors.slope1 ? "error" : ""}`}>
            1241A: Slope 1 of Tripping Characteristic
          </label>
          <input
            type="number"
            className={`calc-input ${errors.slope1 ? "error" : ""}`}
            placeholder="Enter Setting Value"
            value={slope1}
            onChange={updateField(setSlope1, "slope1")}
          />
        </div>

        <div className="calc-input-group">
          <label className={`calc-label ${errors.point1 ? "error" : ""}`}>
            1242A: Base Point for Slope 1 of Charac.
          </label>
          <input
            type="number"
            className={`calc-input ${errors.point1 ? "error" : ""}`}
            placeholder="Enter Setting value"
            value={point1}
            onChange={updateField(setPoint1, "point1")}
          />
        </div>

        <div className="calc-input-group">
          <label className={`calc-label ${errors.slope2 ? "error" : ""}`}>
            1243A: Slope 2 of Tripping Characteristic
          </label>
          <input
            type="number"
            className={`calc-input ${errors.slope2 ? "error" : ""}`}
            placeholder="Enter Setting Value"
            value={slope2}
            onChange={updateField(setSlope2, "slope2")}
          />
        </div>

        <div className="calc-input-group">
          <label className={`calc-label ${errors.point2 ? "error" : ""}`}>
            1244A: Base Point for Slope 2 of Charac.
          </label>
          <input
            type="number"
            className={`calc-input ${errors.point2 ? "error" : ""}`}
            placeholder="Enter Setting Value"
            value={point2}
            onChange={updateField(setPoint2, "point2")}
          />
        </div>

        <div className="calc-input-group">
          <label className={`calc-label ${errors.highset ? "error" : ""}`}>
            1231: Pickup Value of High Set Trip
          </label>
          <input
            type="number"
            className={`calc-input ${errors.highset ? "error" : ""}`}
            placeholder="Enter Setting Value"
            value={highset}
            onChange={updateField(setHighset, "highset")}
          />
        </div>

        <div className="calc-button-row">
          <button className="calc-btn primary" onClick={calculateSlope}>
            Calculate
          </button>
          <button className="calc-btn reset" onClick={resetForm}>
            Reset
          </button>
        </div>

        {result !== null && (
          <div className="calc-result-container">
            <div className="calc-result-row">
              <span className="calc-result-value" style={{ fontSize: "14px" }}>
                {result}
              </span>
              <button className="calc-copy-btn" onClick={copyToClipboard}>
                <FaClipboard />
              </button>
            </div>
          </div>
        )}

        {graphData.length > 0 && (
          <div className="calc-chart-container">
            {/* <div className="chart-zoom-controls">
              <button
                className="zoom-btn"
                onClick={handleZoomOut}
                disabled={zoomLevel <= MIN_ZOOM}
              >
                <FaMagnifyingGlassMinus />
              </button>
              <button className="zoom-btn" onClick={handleZoomReset}>
                <FaArrowsRotate />
              </button>
              <button
                className="zoom-btn"
                onClick={handleZoomIn}
                disabled={zoomLevel >= MAX_ZOOM}
              >
                <FaMagnifyingGlassPlus />
              </button>
            </div> */}
            <ResponsiveContainer width="100%" height={320}>
              <LineChart
                data={graphData}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorArea61X" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0086c9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0071bd" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="x"
                  stroke="white"
                  tick={{ fill: "white", fontSize: 12 }}
                  tickFormatter={(val) => val.toFixed(1)}
                />
                <YAxis
                  stroke="white"
                  tick={{ fill: "white", fontSize: 12 }}
                  tickFormatter={(val) => val.toFixed(1)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#14293d",
                    border: "1px solid #3a6276",
                    borderRadius: "8px",
                    color: "white",
                  }}
                  formatter={(value) => [value.toFixed(2), "Y"]}
                  labelFormatter={(label) => `X: ${label.toFixed(2)}`}
                />
                <Area
                  type="linear"
                  dataKey="y"
                  stroke="#a1616102"
                  strokeWidth={2}
                  fill="url(#colorArea61X)"
                />
                <Line
                  type="linear"
                  dataKey="y"
                  stroke="#00ccff"
                  strokeWidth={2}
                  dot={{ fill: "#0fe3eb", strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, fill: "#0fe3eb" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
