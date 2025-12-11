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
  showSpinner = false,
}) {
  useLockBodyScroll(visible);

  if (!visible) return null;

  const isVertical = buttons.length > 2;

  return createPortal(
    <div className="modal-overlay">
      <div className="alert-box">
        {showSpinner && (
          <div className="alert-spinner-container">
            <div className="alert-spinner"></div>
          </div>
        )}
        {title && <div className="alert-title">{title}</div>}
        {message && <div className="alert-message">{message}</div>}

        {buttons.length > 0 && (
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

                    if (btn.closeOnPress !== false) {
                      onRequestClose();
                    }
                  }}
                  className={`alert-button ${btnStyle}`}
                >
                  {btn.text}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
