import React, { useState, useEffect } from "react";
import {
  FaFile,
  FaFilePdf,
  FaFileImage,
  FaFileVideo,
  FaFileAlt,
  FaSpinner,
} from "react-icons/fa";
import useLockBodyScroll from "../hooks/useLockBodyScroll";
import "../App.css";

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export default function PropertiesModal({
  visible,
  file,
  uploader,
  loading,
  onClose,
}) {
  useLockBodyScroll(visible);
  const [originalExpanded, setOriginalExpanded] = useState(false);

  useEffect(() => {
    if (!visible) {
      setTimeout(() => setOriginalExpanded(false), 0);
    }
  }, [visible]);

  if (!visible || !file) return null;

  const rawOriginal = (file.path || file.name)?.replace(/^[^_]*_/, "") || "";
  const needsTruncate = rawOriginal.length > 30;
  const displayOriginal =
    !needsTruncate || originalExpanded
      ? rawOriginal
      : rawOriginal.slice(0, 30) + "...";

  const renderPropRow = (
    label,
    value,
    isLast = false,
    isClickable = false,
    onClick = null
  ) => {
    if (!value) return null;

    return (
      <React.Fragment key={label}>
        <div className="detail-row">
          <span className="detail-label">{label}</span>
          {isClickable && onClick ? (
            <span
              className="detail-value clickable"
              onClick={onClick}
              style={{ cursor: "pointer" }}
            >
              {value}
            </span>
          ) : (
            <span className="detail-value">{value}</span>
          )}
        </div>
        {!isLast && <div className="detail-divider" />}
      </React.Fragment>
    );
  };

  const handlePhoneClick = (phone) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\s+/g, "");
    const telLink = document.createElement("a");
    telLink.href = `tel:${cleanPhone}`;
    telLink.click();
  };

  const getFileIcon = () => {
    const mimeType = file.mime_type || "";
    const fileName = file.name || "";

    if (mimeType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf")) {
      return <FaFilePdf size={48} color="#ef4444" />;
    }
    if (
      mimeType.includes("image") ||
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName)
    ) {
      return <FaFileImage size={48} color="#10b981" />;
    }
    if (
      mimeType.includes("video") ||
      /\.(mp4|avi|mov|wmv|webm)$/i.test(fileName)
    ) {
      return <FaFileVideo size={48} color="#8b5cf6" />;
    }
    return <FaFileAlt size={48} color="#60a5fa" />;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container properties-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">Properties</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="props-content">
          <div className="file-summary-card">
            <div className="file-icon-box">{getFileIcon()}</div>
            <h3 className="sel-name" title={file.name}>
              {file.name || "File"}
            </h3>
            <p className="sel-email" title={file.uploaded_by_email}>
              {file.uploaded_by_email || "—"}
            </p>
          </div>

          <h4 className="section-title">File Details</h4>
          <div className="detail-card">
            <div className="detail-row">
              <span className="detail-label">Size</span>
              <span className="detail-value">{formatBytes(file.size)}</span>
            </div>

            <div className="detail-divider" />

            <div
              className="detail-row"
              onClick={() => setOriginalExpanded((p) => !p)}
              style={{ cursor: needsTruncate ? "pointer" : "default" }}
            >
              {!originalExpanded && (
                <span className="detail-label">Original Name</span>
              )}
              <span className="detail-value">{displayOriginal || "—"}</span>
            </div>

            <div className="detail-divider" />

            <div className="detail-row">
              <span className="detail-label">Upload Date</span>
              <span className="detail-value">
                {file.uploaded_at
                  ? new Date(file.uploaded_at).toLocaleString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : "—"}
              </span>
            </div>

            {file.last_renamed_by && (
              <>
                <div className="detail-divider" />
                <div className="detail-row">
                  <span className="detail-label">Renamed By</span>
                  <span className="detail-value">{file.last_renamed_by}</span>
                </div>
                <div className="detail-divider" />
                <div className="detail-row">
                  <span className="detail-label">Last Rename</span>
                  <span className="detail-value">
                    {file.last_renamed_at
                      ? new Date(file.last_renamed_at).toLocaleString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "—"}
                  </span>
                </div>
              </>
            )}
          </div>

          <h4 className="section-title">Uploader Profile</h4>
          <div className="detail-card">
            {loading ? (
              <div
                style={{
                  padding: "32px 20px",
                  textAlign: "center",
                  color: "#9aa7b2",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <FaSpinner className="spinner" size={24} />
                <span>Loading uploader details...</span>
              </div>
            ) : uploader ? (
              <>
                {renderPropRow("Name", uploader.full_name)}
                {renderPropRow("Age", uploader.age)}
                {uploader.phone &&
                  renderPropRow("Phone", uploader.phone, false, true, () =>
                    handlePhoneClick(uploader.phone)
                  )}
                {renderPropRow("BPS", uploader.bps)}
                {renderPropRow("Department", uploader.department)}
                {renderPropRow("Address", uploader.address, !uploader._deleted)}

                {uploader._deleted && (
                  <div className="detail-row" style={{ borderBottom: 0 }}>
                    <span className="detail-label" style={{ color: "#ffb3b3" }}>
                      Account Deleted
                    </span>
                    <span className="detail-value" style={{ color: "#ffb3b3" }}>
                      {uploader.deleted_at
                        ? new Date(uploader.deleted_at).toLocaleDateString()
                        : "Yes"}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: "#a1a1a1", padding: "16px" }}>
                No uploader details found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
