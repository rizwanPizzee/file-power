import React, { useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
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
            <OverlayTrigger
              placement="bottom"
              delay={{ show: 400, hide: 100 }}
              overlay={<Tooltip id="tooltip-reload">Reload File</Tooltip>}
            >
              <button
                onClick={() => setKey((k) => k + 1)}
                className="icon-button"
              >
                <FaRedo />
              </button>
            </OverlayTrigger>
            {url && (
              <OverlayTrigger
                placement="bottom"
                delay={{ show: 400, hide: 100 }}
                overlay={
                  <Tooltip id="tooltip-external">Open in New Tab</Tooltip>
                }
              >
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
              </OverlayTrigger>
            )}
          </div>
          <span className="viewer-title">{file?.name || "File Viewer"}</span>
          <OverlayTrigger
            placement="bottom"
            delay={{ show: 400, hide: 100 }}
            overlay={<Tooltip id="tooltip-close">Close Viewer</Tooltip>}
          >
            <button onClick={onClose} className="icon-button">
              <FaTimes />
            </button>
          </OverlayTrigger>
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
