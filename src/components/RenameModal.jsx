import React, { useState, useEffect } from "react";
import useLockBodyScroll from "../hooks/useLockBodyScroll";
import "../App.css";

export default function RenameModal({ visible, file, onClose, onSave }) {
  const [newName, setNewName] = useState("");
  const [extension, setExtension] = useState("");

  useLockBodyScroll(visible);

  useEffect(() => {
    if (file && visible) {
      const parts = (file.name || "").split(".");
      let ext = "";
      let base = file.name || "";
      if (parts.length > 1) {
        ext = parts.pop();
        base = parts.join(".");
      }
      // Use setTimeout to avoid cascading renders
      setTimeout(() => {
        setNewName(base);
        setExtension(ext);
      }, 0);
    }
  }, [file, visible]);

  const handleSave = () => {
    if (!newName.trim()) {
      return;
    }
    const fullName = extension
      ? `${newName.trim()}.${extension}`
      : newName.trim();
    onSave(fullName);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Rename File</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="current-filename">
            <span className="current-label">Current name:</span>
            <span className="current-value" title={file?.name}>
              {file?.name}
            </span>
          </div>

          <div className="">
            <label className="input-label">New Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rename-input"
              placeholder="Enter new filename"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) handleSave();
                if (e.key === "Escape") onClose();
              }}
            />
            <p className="helper-text">
              {extension
                ? `Extension .${extension} will be preserved`
                : "No extension detected"}
            </p>
          </div>

          <div className="action-row">
            <button className="full-action-btn cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="full-action-btn save-btn"
              onClick={handleSave}
              disabled={
                !newName.trim() ||
                newName.trim() ===
                  (file?.name?.split(".").slice(0, -1).join(".") || file?.name)
              }
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
