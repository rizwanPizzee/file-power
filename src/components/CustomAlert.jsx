import React from "react";
import { createPortal } from "react-dom";
import useLockBodyScroll from "../hooks/useLockBodyScroll";
import "../App.css";

export default function CustomAlert({
  visible,
  title,
  message,
  buttons = [{ text: "OK", style: "default", onPress: () => {} }],
  onRequestClose = () => {},
}) {
  useLockBodyScroll(visible);

  if (!visible) return null;

  const isVertical = buttons.length > 2;

  return createPortal(
    <div className="modal-overlay">
      <div className="alert-box">
        {title && <div className="alert-title">{title}</div>}
        {message && <div className="alert-message">{message}</div>}

        <div className={`alert-buttons ${isVertical ? "vertical" : ""}`}>
          {buttons.map((btn, idx) => {
            const btnStyle = btn.style || "default";
            return (
              <button
                key={idx}
                onClick={() => {
                  try {
                    btn.onPress && btn.onPress();
                  } catch (e) {
                    console.warn("alert button handler error", e);
                  }
                  onRequestClose();
                }}
                className={`alert-button ${btnStyle}`}
              >
                {btn.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
