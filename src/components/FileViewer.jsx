import React, { useState } from "react";
import { FaTimes, FaExternalLinkAlt, FaRedo } from "react-icons/fa";
import useLockBodyScroll from "../hooks/useLockBodyScroll";
import "../App.css";

export default function FileViewer({ visible, file, url, onClose }) {
  useLockBodyScroll(visible);
  const [key, setKey] = useState(0); // State to force iframe re-render

  if (!visible || !url) return null;

  return (
    <div className="modal-overlay viewer-overlay">
      <div className="viewer-container">
        <div className="viewer-header">
          <div className="viewer-actions">
            <button
              onClick={() => setKey((k) => k + 1)}
              className="icon-button"
            >
              <FaRedo />
            </button>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="icon-button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "inherit",
                }}
              >
                <FaExternalLinkAlt />
              </a>
            )}
          </div>
          <span className="viewer-title">{file?.name || "File Viewer"}</span>
          <button onClick={onClose} className="icon-button">
            <FaTimes />
          </button>
        </div>
        <div className="viewer-content">
          <iframe
            key={key}
            src={url}
            title={file?.name}
            className="viewer-iframe"
          />
        </div>
      </div>
    </div>
  );
}
