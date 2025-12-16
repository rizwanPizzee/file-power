import React, { useState, useEffect } from "react";
import {
  FaFolder,
  FaHome,
  FaChevronRight,
  FaChevronDown,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import { listFolders } from "../lib/storage";
import "../App.css";

export default function MoveToFolderModal({
  visible,
  file,
  currentFolderId,
  onClose,
  onMove,
  moving = false,
}) {
  const [treeData, setTreeData] = useState({});
  const [expanded, setExpanded] = useState(new Set());
  const [loading, setLoading] = useState(new Set());

  useEffect(() => {
    if (visible) {
      setTreeData({});
      setExpanded(new Set());
      loadFolder(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const loadFolder = async (parentId) => {
    const key = parentId || "root";
    if (loading.has(key)) return;

    setLoading((prev) => new Set(prev).add(key));
    try {
      const folders = await listFolders({ parentFolderId: parentId });
      setTreeData((prev) => ({
        ...prev,
        [key]: folders,
      }));
    } catch (e) {
      console.warn("Failed to load folders for move tree", e);
    } finally {
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const toggleExpand = async (folderId) => {
    const isExpanded = expanded.has(folderId);
    if (isExpanded) {
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(folderId);
        return next;
      });
    } else {
      setExpanded((prev) => new Set(prev).add(folderId));
      if (!treeData[folderId]) {
        await loadFolder(folderId);
      }
    }
  };

  const renderTreeItem = (folder, level = 0) => {
    const isExpanded = expanded.has(folder.id);
    const isLoading = loading.has(folder.id);
    const children = treeData[folder.id] || [];

    const isCurrentFolder = folder.id === currentFolderId;
    const isSameAsFileFolder = folder.id === file?.folder_id;
    const isDisabled = isCurrentFolder || isSameAsFileFolder;

    return (
      <div key={folder.id} className="move-tree-node">
        <div
          className="move-tree-item"
          style={{ paddingLeft: `${level * 20 + 12}px` }}
        >
          <button
            className="move-tree-expand"
            onClick={() => toggleExpand(folder.id)}
          >
            {isLoading ? (
              <FaSpinner className="spinner" />
            ) : isExpanded ? (
              <FaChevronDown />
            ) : (
              <FaChevronRight />
            )}
          </button>

          <button
            className={`move-tree-folder ${isDisabled ? "disabled" : ""}`}
            onClick={() => !isDisabled && !moving && onMove(folder.id)}
            disabled={isDisabled || moving}
          >
            <FaFolder className="move-folder-icon" />
            <span className="move-folder-name">{folder.name}</span>
            {isCurrentFolder && (
              <span className="move-current-label">(Current)</span>
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="move-tree-children">
            {isLoading ? (
              <div
                className="move-tree-loading"
                style={{ paddingLeft: `${(level + 1) * 20 + 40}px` }}
              >
                <FaSpinner className="spinner" />
              </div>
            ) : children.length > 0 ? (
              children.map((child) => renderTreeItem(child, level + 1))
            ) : (
              <div
                className="move-tree-empty"
                style={{ paddingLeft: `${(level + 1) * 20 + 40}px` }}
              >
                Empty
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!visible) return null;

  const rootFolders = treeData["root"] || [];
  const rootLoading = loading.has("root");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content move-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Move to Folder</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="move-file-info">
          Moving: <strong>{file?.name}</strong>
        </div>

        <div className="move-tree-container">
          {/* Root option */}
          <div className="move-tree-item root-item">
            <button
              className={`move-tree-folder ${
                currentFolderId === null ? "disabled" : ""
              }`}
              onClick={() =>
                currentFolderId !== null && !moving && onMove(null)
              }
              disabled={currentFolderId === null || moving}
            >
              <FaHome className="move-folder-icon" />
              <span className="move-folder-name">Root</span>
              {currentFolderId === null && (
                <span className="move-current-label">(Current)</span>
              )}
            </button>
          </div>

          {rootLoading ? (
            <div className="move-tree-loading">
              <FaSpinner className="spinner" /> Loading folders...
            </div>
          ) : rootFolders.length > 0 ? (
            rootFolders.map((folder) => renderTreeItem(folder, 0))
          ) : (
            <div className="move-tree-empty">No folders available</div>
          )}
        </div>

        {moving && (
          <div className="move-progress">
            <FaSpinner className="spinner" /> Moving file...
          </div>
        )}
      </div>
    </div>
  );
}
