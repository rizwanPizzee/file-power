import React, { useState, useEffect } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import {
  FaFile,
  FaFilePdf,
  FaFileImage,
  FaFileAlt,
  FaDownload,
  FaTrash,
  FaEye,
  FaEllipsisV,
  FaFolderOpen,
  FaEdit,
  FaInfoCircle,
  FaShareAlt,
  FaFolder,
  FaArrowsAlt,
} from "react-icons/fa";
import "../App.css";
import SkeletonItem from "./SkeletonItem";

export default function FileList({
  data,
  layout = "grid", // 'grid' or 'list'
  refreshing,
  onDelete,
  onDownload,
  onView,
  onRename,
  onProperties,
  onShare,
  onMove,
  onFolderOpen,
  onFolderRename,
  onFolderDelete,
  onFolderProperties,
  downloadingFileId,
  downloadProgress,
  currentUserEmail,
  duplicatesMap = {},
  activeDuplicateFileId = null,
  onDuplicateTagClick = () => {},
}) {
  const [menuFile, setMenuFile] = useState(null);
  const [menuType, setMenuType] = useState(null); // 'file' or 'folder'
  const [hoveredFile, setHoveredFile] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => {
      setMenuFile(null);
      setMenuType(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes("pdf"))
      return <FaFilePdf className="file-icon-img pdf" />;
    if (mimeType?.includes("image"))
      return <FaFileImage className="file-icon-img image" />;
    return <FaFileAlt className="file-icon-img generic" />;
  };

  const handleMenuClick = (e, item, type) => {
    e.stopPropagation();
    if (menuFile?.id === item.id) {
      setMenuFile(null);
      setMenuType(null);
    } else {
      setMenuFile(item);
      setMenuType(type);
    }
  };

  const handleMenuAction = (action, item) => {
    setMenuFile(null);
    setMenuType(null);
    action(item);
  };

  const handleDuplicateTagClick = (e, fileId) => {
    e.stopPropagation();
    onDuplicateTagClick(activeDuplicateFileId === fileId ? null : fileId);
  };

  const renderFolderItem = (folder) => {
    const fileCount = folder.files?.[0]?.count || 0;
    const folderCount = folder.folders?.[0]?.count || 0;
    const totalItems = fileCount + folderCount;
    const itemText = `${totalItems} item${totalItems !== 1 ? "s" : ""}`;

    let dateStr = "";
    if (folder.created_at) {
      const d = new Date(folder.created_at);
      dateStr = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    }

    if (layout === "list") {
      const isMenuOpen = menuFile?.id === folder.id;
      return (
        <div
          key={folder.id}
          className="file-list-card"
          style={{ zIndex: isMenuOpen ? 100 : 1 }}
          onClick={() => onFolderOpen && onFolderOpen(folder.id, folder.name)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMenuClick(e, folder, "folder");
          }}
        >
          <div className="file-list-preview">
            <FaFolder
              className="folder-icon-large"
              style={{ fontSize: "1.5rem" }}
            />
          </div>
          <div className="file-list-info">
            <div className="file-list-name-container">
              <div className="file-list-name" title={folder.name}>
                {folder.name}
              </div>
            </div>
            <div className="file-list-meta">
              <span>{dateStr}</span>
              <span>{itemText}</span>
            </div>
          </div>
          <div className="file-list-actions active">
            <button
              className="action-btn"
              onClick={(e) => handleMenuClick(e, folder, "folder")}
              title="More options"
            >
              <FaEllipsisV />
            </button>
            {menuFile?.id === folder.id && menuType === "folder" && (
              <div
                className="file-menu-dropdown"
                style={{ right: 0, top: "100%" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="menu-item"
                  onClick={() =>
                    handleMenuAction(
                      () =>
                        onFolderOpen && onFolderOpen(folder.id, folder.name),
                      folder
                    )
                  }
                >
                  <FaFolderOpen className="menu-icon" />
                  <span>Open Folder</span>
                </div>
                <div
                  className="menu-item"
                  onClick={() =>
                    handleMenuAction(onFolderRename || (() => {}), folder)
                  }
                >
                  <FaEdit className="menu-icon" />
                  <span>Rename</span>
                </div>
                <div
                  className="menu-item"
                  onClick={() =>
                    handleMenuAction(onFolderProperties || (() => {}), folder)
                  }
                >
                  <FaInfoCircle className="menu-icon" />
                  <span>Properties</span>
                </div>
                <div className="menu-divider" />
                {currentUserEmail &&
                  [
                    "rizwanpizzee@gmail.com",
                    "khanabdurrehman945@gmail.com",
                    "naveedayaz@gmail.com",
                    "zahid.razzaq149@gmail.com",
                  ].includes(currentUserEmail) && (
                    <div
                      className="menu-item delete"
                      onClick={() =>
                        handleMenuAction(onFolderDelete || (() => {}), folder)
                      }
                    >
                      <FaTrash className="menu-icon" />
                      <span>Delete</span>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      );
    }

    const isMenuOpen = menuFile?.id === folder.id;
    return (
      <div
        key={folder.id}
        className="file-grid-card folder-card"
        style={{ zIndex: isMenuOpen ? 100 : 1 }}
        onMouseEnter={() => setHoveredFile(folder)}
        onMouseLeave={() => setHoveredFile(null)}
        onContextMenu={(e) => {
          e.preventDefault();
          handleMenuClick(e, folder, "folder");
        }}
      >
        <div
          className="file-grid-preview folder-preview"
          onClick={() => onFolderOpen && onFolderOpen(folder.id, folder.name)}
        >
          <div className="file-grid-icon">
            <FaFolder className="folder-icon-large" />
          </div>
        </div>

        <div
          className="file-grid-info"
          onClick={() => onFolderOpen && onFolderOpen(folder.id, folder.name)}
        >
          <div className="file-grid-name" title={folder.name}>
            {folder.name}
          </div>
          <div className="file-grid-meta">
            {dateStr} • {itemText}
          </div>
        </div>

        <div
          className={`file-grid-actions ${
            menuFile?.id === folder.id ? "active" : ""
          }`}
        >
          <button
            className="action-btn menu-btn"
            onClick={(e) => handleMenuClick(e, folder, "folder")}
            title="More options"
          >
            <FaEllipsisV />
          </button>

          {menuFile?.id === folder.id && menuType === "folder" && (
            <div
              className="file-menu-dropdown"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="menu-item"
                onClick={() =>
                  handleMenuAction(
                    () => onFolderOpen && onFolderOpen(folder.id, folder.name),
                    folder
                  )
                }
              >
                <FaFolderOpen className="menu-icon" />
                <span>Open Folder</span>
              </div>
              <div
                className="menu-item"
                onClick={() =>
                  handleMenuAction(onFolderRename || (() => {}), folder)
                }
              >
                <FaEdit className="menu-icon" />
                <span>Rename</span>
              </div>
              <div
                className="menu-item"
                onClick={() =>
                  handleMenuAction(onFolderProperties || (() => {}), folder)
                }
              >
                <FaInfoCircle className="menu-icon" />
                <span>Properties</span>
              </div>
              <div className="menu-divider" />
              {currentUserEmail &&
                [
                  "rizwanpizzee@gmail.com",
                  "khanabdurrehman945@gmail.com",
                  "naveedayaz@gmail.com",
                  "zahid.razzaq149@gmail.com",
                ].includes(currentUserEmail) && (
                  <div
                    className="menu-item delete"
                    onClick={() =>
                      handleMenuAction(onFolderDelete || (() => {}), folder)
                    }
                  >
                    <FaTrash className="menu-icon" />
                    <span>Delete</span>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFileItem = (file) => {
    const hasDuplicates =
      duplicatesMap[file.id] && duplicatesMap[file.id].others?.length > 0;
    const isHovered = hoveredFile?.id === file.id;

    if (layout === "list") {
      const isMenuOpen = menuFile?.id === file.id;
      return (
        <div
          key={file.id || file.path}
          className="file-list-card"
          style={{ zIndex: isMenuOpen ? 100 : 1 }}
          onClick={() => onView(file)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMenuClick(e, file, "file");
          }}
        >
          <div className="file-list-preview">
            <div
              className="file-list-icon"
              style={{
                fontSize: "1.5rem",
                display: "flex",
                alignItems: "center",
              }}
            >
              {getFileIcon(file.mime_type)}
            </div>
          </div>

          <div className="file-list-info">
            <div className="file-list-name-container">
              <div className="file-list-name" title={file.name}>
                {file.name}
              </div>
            </div>
            <div className="file-list-meta">
              {file.folderName && (
                <span className="folder-badge" style={{ marginRight: 10 }}>
                  <FaFolder style={{ marginRight: 4, fontSize: "0.8rem" }} />
                  {file.folderName}
                </span>
              )}
              <span style={{ minWidth: 70, textAlign: "right" }}>
                {formatBytes(file.size)}
              </span>
              <span style={{ minWidth: 90, textAlign: "right" }}>
                {new Date(file.uploaded_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="file-list-actions active">
            <button
              className="action-btn"
              onClick={(e) => handleMenuClick(e, file, "file")}
              disabled={downloadingFileId === file.id}
              title="More options"
            >
              <FaEllipsisV />
            </button>
            {menuFile?.id === file.id && menuType === "file" && (
              <div
                className="file-menu-dropdown"
                style={{ right: 0, top: "100%" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="menu-item"
                  onClick={() => handleMenuAction(onView, file)}
                >
                  <FaFolderOpen className="menu-icon" />
                  <span>Open File</span>
                </div>
                <div
                  className={`menu-item ${downloadingFileId ? "disabled" : ""}`}
                  onClick={() => {
                    if (!downloadingFileId) {
                      handleMenuAction(onDownload, file);
                    }
                  }}
                  style={{
                    opacity: downloadingFileId ? 0.5 : 1,
                    cursor: downloadingFileId ? "not-allowed" : "pointer",
                  }}
                >
                  <FaDownload className="menu-icon" />
                  <span>Download</span>
                </div>
                <div
                  className="menu-item"
                  onClick={() => handleMenuAction(onRename, file)}
                >
                  <FaEdit className="menu-icon" />
                  <span>Rename</span>
                </div>
                <div
                  className="menu-item"
                  onClick={() => handleMenuAction(onMove || (() => {}), file)}
                >
                  <FaArrowsAlt className="menu-icon" />
                  <span>Move to Folder</span>
                </div>
                <div
                  className="menu-item"
                  onClick={() => handleMenuAction(onProperties, file)}
                >
                  <FaInfoCircle className="menu-icon" />
                  <span>Properties</span>
                </div>
                {/* <div
                className="menu-item"
                onClick={() => handleMenuAction(onShare, file)}
              >
                <FaShareAlt className="menu-icon" />
                <span>Share</span>
              </div> */}
                <div className="menu-divider" />
                {currentUserEmail &&
                  [
                    "rizwanpizzee@gmail.com",
                    "khanabdurrehman945@gmail.com",
                    "naveedayaz@gmail.com",
                    "zahid.razzaq149@gmail.com",
                  ].includes(currentUserEmail) && (
                    <div
                      className="menu-item delete"
                      onClick={() => handleMenuAction(onDelete, file)}
                    >
                      <FaTrash className="menu-icon" />
                      <span>Delete</span>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      );
    }

    const isMenuOpen = menuFile?.id === file.id;
    return (
      <div
        key={file.id || file.path}
        className="file-grid-card"
        style={{ zIndex: isMenuOpen ? 100 : 1 }}
        onMouseEnter={() => setHoveredFile(file)}
        onMouseLeave={() => setHoveredFile(null)}
        onContextMenu={(e) => {
          e.preventDefault();
          handleMenuClick(e, file, "file");
        }}
      >
        {downloadingFileId === file.id && (
          <div className="download-overlay">
            <div className="download-percent">
              {Math.round(downloadProgress)}%
            </div>
            <div className="download-bar-bg">
              <div
                className="download-bar-fill"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <div className="download-text">Downloading...</div>
          </div>
        )}

        <div className="file-grid-preview" onClick={() => onView(file)}>
          <div className="file-grid-icon">{getFileIcon(file.mime_type)}</div>
        </div>

        <div className="file-grid-info" onClick={() => onView(file)}>
          <OverlayTrigger
            placement="bottom"
            delay={{ show: 400, hide: 100 }}
            overlay={
              <Tooltip id={`tooltip-file-${file.id}`}>{file.name}</Tooltip>
            }
          >
            <div className="file-grid-name">{file.name}</div>
          </OverlayTrigger>
          <div
            className="file-grid-meta"
            title={file.folderName || "No Folder"}
          >
            {file.folderName && (
              <span className="folder-badge">
                <FaFolder style={{ marginRight: 4, fontSize: "0.6rem" }} />
                {file.folderName} •{" "}
              </span>
            )}
            {formatBytes(file.size)} •{" "}
            {new Date(file.uploaded_at).toLocaleDateString()}
          </div>
        </div>

        <div
          className={`file-grid-actions ${
            menuFile?.id === file.id ? "active" : ""
          }`}
        >
          <button
            className="action-btn menu-btn"
            onClick={(e) => handleMenuClick(e, file, "file")}
            disabled={downloadingFileId === file.id}
            title="More options"
          >
            <FaEllipsisV />
          </button>

          {menuFile?.id === file.id && menuType === "file" && (
            <div
              className="file-menu-dropdown"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="menu-item"
                onClick={() => handleMenuAction(onView, file)}
              >
                <FaFolderOpen className="menu-icon" />
                <span>Open File</span>
              </div>
              <div
                className={`menu-item ${downloadingFileId ? "disabled" : ""}`}
                onClick={() => {
                  if (!downloadingFileId) {
                    handleMenuAction(onDownload, file);
                  }
                }}
                style={{
                  opacity: downloadingFileId ? 0.5 : 1,
                  cursor: downloadingFileId ? "not-allowed" : "pointer",
                }}
              >
                <FaDownload className="menu-icon" />
                <span>Download</span>
              </div>
              <div
                className="menu-item"
                onClick={() => handleMenuAction(onRename, file)}
              >
                <FaEdit className="menu-icon" />
                <span>Rename</span>
              </div>
              <div
                className="menu-item"
                onClick={() => handleMenuAction(onMove || (() => {}), file)}
              >
                <FaArrowsAlt className="menu-icon" />
                <span>Move to Folder</span>
              </div>
              <div
                className="menu-item"
                onClick={() => handleMenuAction(onProperties, file)}
              >
                <FaInfoCircle className="menu-icon" />
                <span>Properties</span>
              </div>
              {/* <div
                className="menu-item"
                onClick={() => handleMenuAction(onShare, file)}
              >
                <FaShareAlt className="menu-icon" />
                <span>Share</span>
              </div> */}
              <div className="menu-divider" />
              {currentUserEmail &&
                [
                  "rizwanpizzee@gmail.com",
                  "khanabdurrehman945@gmail.com",
                  "naveedayaz@gmail.com",
                  "zahid.razzaq149@gmail.com",
                ].includes(currentUserEmail) && (
                  <div
                    className="menu-item delete"
                    onClick={() => handleMenuAction(onDelete, file)}
                  >
                    <FaTrash className="menu-icon" />
                    <span>Delete</span>
                  </div>
                )}
            </div>
          )}
        </div>

        {hasDuplicates && (
          <div
            className={`duplicate-tag ${
              activeDuplicateFileId === file.id ||
              (activeDuplicateFileId &&
                duplicatesMap[activeDuplicateFileId]?.others?.some(
                  (f) => f.id === file.id
                ))
                ? "active"
                : ""
            }`}
            style={{
              opacity:
                isHovered ||
                (hoveredFile &&
                  duplicatesMap[hoveredFile.id]?.others?.some(
                    (f) => f.id === file.id
                  )) ||
                activeDuplicateFileId === file.id ||
                (activeDuplicateFileId &&
                  duplicatesMap[activeDuplicateFileId]?.others?.some(
                    (f) => f.id === file.id
                  ))
                  ? 1
                  : 0,
              pointerEvents: "auto",
              cursor: "pointer",
            }}
            onClick={(e) => handleDuplicateTagClick(e, file.id)}
          >
            <span>Duplicate ({duplicatesMap[file.id].index})</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="file-list-container">
      {/* {refreshing && (
        <div
          className="loading-indicator"
          style={{
            textAlign: "center",
            padding: "12px",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          <FaFile
            style={{ animation: "pulse 1.5s infinite", marginRight: "8px" }}
          />
          Loading...
        </div>
      )} */}

      <div className="files-content">
        {refreshing ? (
          <div
            className={
              layout === "list" ? "file-list-container" : "file-grid-container"
            }
          >
            {Array.from({ length: 15 }).map((_, index) => (
              <SkeletonItem key={`skel-${index}`} layout={layout} />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "var(--text-muted)",
            }}
            className="fade-in"
          >
            <FaFileAlt
              style={{
                fontSize: "4rem",
                marginBottom: "20px",
                opacity: 0.3,
              }}
            />
            <div
              style={{
                fontSize: "1.2rem",
                fontWeight: "600",
                color: "var(--text-secondary)",
                marginBottom: "8px",
              }}
            >
              No files or folders
            </div>
            <div style={{ fontSize: "0.9rem" }}>
              Upload files or create a folder to get started
            </div>
          </div>
        ) : (
          <div
            className={
              layout === "list" ? "file-list-container" : "file-grid-container"
            }
          >
            {data.map((item) =>
              item._isFolder ? renderFolderItem(item) : renderFileItem(item)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
