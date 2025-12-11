import React, { useState, useEffect } from "react";
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
} from "react-icons/fa";
import "../App.css";

export default function FileList({
  data,
  refreshing,
  onDelete,
  onDownload,
  onView,
  onRename,
  onProperties,
  onShare,
  downloadingFileId,
  downloadProgress,
  currentUserEmail,
  duplicatesMap = {},
  activeDuplicateFileId = null,
  onDuplicateTagClick = () => {},
}) {
  const [menuFile, setMenuFile] = useState(null);
  const [hoveredFile, setHoveredFile] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => {
      setMenuFile(null);
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

  const handleMenuClick = (e, file) => {
    e.stopPropagation();
    setMenuFile(menuFile?.id === file.id ? null : file);
  };

  const handleMenuAction = (action, file) => {
    setMenuFile(null);
    action(file);
  };

  const handleDuplicateTagClick = (e, fileId) => {
    e.stopPropagation();
    onDuplicateTagClick(activeDuplicateFileId === fileId ? null : fileId);
  };

  return (
    <div className="file-list-container">
      {refreshing && (
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
          Refreshing...
        </div>
      )}

      <div className="files-content">
        {data.length === 0 ? (
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
              No files yet
            </div>
            <div style={{ fontSize: "0.9rem" }}>
              Upload your first file to get started
            </div>
          </div>
        ) : (
          <div className="file-grid-container">
            {data.map((file) => {
              const hasDuplicates =
                duplicatesMap[file.id] &&
                duplicatesMap[file.id].others?.length > 0;
              const isHovered = hoveredFile?.id === file.id;
              return (
                <div
                  key={file.id || file.path}
                  className="file-grid-card"
                  onMouseEnter={() => setHoveredFile(file)}
                  onMouseLeave={() => setHoveredFile(null)}
                >
                  {downloadingFileId === file.id && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.7)",
                        zIndex: 20,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "var(--radius-lg)",
                        color: "white",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.2rem",
                          fontWeight: "bold",
                          marginBottom: "8px",
                        }}
                      >
                        {Math.round(downloadProgress)}%
                      </div>
                      <div
                        style={{
                          width: "60%",
                          height: "6px",
                          background: "rgba(255,255,255,0.2)",
                          borderRadius: "10px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${downloadProgress}%`,
                            height: "100%",
                            background: "var(--primary-btn)",
                            transition: "width 0.2s ease",
                          }}
                        />
                      </div>
                      <div style={{ fontSize: "0.8rem", marginTop: "8px" }}>
                        Downloading...
                      </div>
                    </div>
                  )}

                  <div
                    className="file-grid-preview"
                    onClick={() => onView(file)}
                  >
                    <div className="file-grid-icon">
                      {getFileIcon(file.mime_type)}
                    </div>
                  </div>

                  <div className="file-grid-info" onClick={() => onView(file)}>
                    <div className="file-grid-name" title={file.name}>
                      {file.name}
                    </div>
                    <div className="file-grid-meta">
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
                      onClick={(e) => handleMenuClick(e, file)}
                      title="More options"
                      disabled={downloadingFileId === file.id}
                    >
                      <FaEllipsisV />
                    </button>

                    {menuFile?.id === file.id && (
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
                          className={`menu-item ${
                            downloadingFileId ? "disabled" : ""
                          }`}
                          onClick={() => {
                            if (!downloadingFileId) {
                              handleMenuAction(onDownload, file);
                            }
                          }}
                          style={{
                            opacity: downloadingFileId ? 0.5 : 1,
                            cursor: downloadingFileId
                              ? "not-allowed"
                              : "pointer",
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
                          onClick={() => handleMenuAction(onProperties, file)}
                        >
                          <FaInfoCircle className="menu-icon" />
                          <span>Properties</span>
                        </div>
                        <div
                          className="menu-item"
                          onClick={() => handleMenuAction(onShare, file)}
                        >
                          <FaShareAlt className="menu-icon" />
                          <span>Share</span>
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}
