import React, { useState, useEffect } from "react";
import { FaTimes, FaSpinner, FaFolder } from "react-icons/fa";
import useLockBodyScroll from "../hooks/useLockBodyScroll";
import "../App.css";
export default function FolderRenameModal({
  visible,
  folder,
  existingNames = [],
  onClose,
  onRename,
}) {
  useLockBodyScroll(visible);
  const [newName, setNewName] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (visible && folder) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewName(folder.name);
      setWarning("");
      setLoading(false);
    }
  }, [visible, folder]);
  const handleNameChange = (text) => {
    setNewName(text);
    if (!text.trim()) {
      setWarning("");
      return;
    }
    if (text.trim() === folder.name) {
      setWarning("");
      return;
    }
    const duplicate = existingNames.some(
      (name) => name.toLowerCase() === text.trim().toLowerCase()
    );
    if (duplicate) {
      setWarning("A folder with this name already exists.");
    } else {
      setWarning("");
    }
  };
  const handleRename = async () => {
    if (!newName.trim() || !!warning || newName.trim() === folder.name) return;
    setLoading(true);
    try {
      await onRename(newName.trim());
      // Parent handles closing
    } catch (err) {
      setWarning(err.message || "Failed to rename folder");
      setLoading(false);
    }
  };
  if (!visible) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Rename Folder</h3>
          <button className="close-btn" onClick={onClose} disabled={loading}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="input-with-icon">
            <input
              type="text"
              className={`modal-input ${warning ? "input-error" : ""}`}
              value={newName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Folder name"
              autoFocus
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") onClose();
              }}
              style={{ paddingLeft: "0px" }}
            />
          </div>

          {warning ? (
            <div className="warning-text">
              {warning} <br />
              <span className="suggestion-text">
                Please add or remove characters.
              </span>
            </div>
          ) : (
            <div className="helper-text space-holder">
              Type a new name for this folder
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button
            className="modal-btn cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="modal-btn primary"
            onClick={handleRename}
            disabled={
              loading ||
              !newName.trim() ||
              !!warning ||
              newName.trim() === folder.name
            }
          >
            {loading ? <FaSpinner className="spinner" /> : "Rename"}
          </button>
        </div>
      </div>
    </div>
  );
}
