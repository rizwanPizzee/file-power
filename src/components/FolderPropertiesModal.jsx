import React, { useState, useEffect } from "react";
import { FaTimes, FaFolder, FaSpinner } from "react-icons/fa";
import { supabase } from "../lib/supabase";
import "../App.css";
import "./FolderPropertiesModal.css";

export default function FolderPropertiesModal({ visible, folder, onClose }) {
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && folder?.created_by_email) {
      fetchCreator(folder.created_by_email);
    } else {
      setCreator(null);
    }
  }, [visible, folder]);

  const fetchCreator = async (email) => {
    setLoading(true);
    try {
      const [activeRes, deletedRes] = await Promise.all([
        supabase
          .from("safe_auth_users")
          .select("*")
          .eq("email", email)
          .limit(1),
        supabase
          .from("deleted_auth_users")
          .select("*")
          .eq("email", email)
          .limit(1),
      ]);

      const deleted = deletedRes.data?.[0] ?? null;
      const active = activeRes.data?.[0] ?? null;
      const u = deleted || active || null;

      if (u) {
        const meta = u.user_metadata || {};
        setCreator({
          full_name: meta.full_name || u.full_name || null,
          email: u.email || null,
          department: u.department || meta.department || null,
          _deleted: !!deleted,
        });
      } else {
        setCreator(null);
      }
    } catch (error) {
      console.warn("Fetch creator failed:", error);
      setCreator(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!visible) return null;

  const fileCount = folder?.files?.[0]?.count || 0;
  const folderCount = folder?.folders?.[0]?.count || 0;
  // eslint-disable-next-line no-unused-vars
  const totalItems = fileCount + folderCount;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content properties-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Folder Properties</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="properties-content">
          {/* Folder Icon & Name */}
          <div className="properties-icon-section">
            <div className="folder-icon-large">
              <FaFolder />
            </div>
            <div className="properties-title">{folder?.name || "Folder"}</div>
          </div>

          {/* Details */}
          <div className="properties-section">
            <div className="properties-row">
              <span className="properties-label">Created</span>
              <span className="properties-value">
                {formatDate(folder?.created_at)}
              </span>
            </div>

            {folder?.original_name && folder.original_name !== folder?.name && (
              <div className="properties-row">
                <span className="properties-label">Original Name</span>
                <span className="properties-value">{folder.original_name}</span>
              </div>
            )}

            {folder?.last_renamed_at && (
              <div className="properties-row">
                <span className="properties-label">Last Renamed</span>
                <span className="properties-value">
                  {formatDate(folder.last_renamed_at)}
                  {folder.last_renamed_by && ` by ${folder.last_renamed_by}`}
                </span>
              </div>
            )}

            <div className="properties-row">
              <span className="properties-label">Contents</span>
              <span className="properties-value">
                {folderCount} folder{folderCount !== 1 ? "s" : ""}, {fileCount}{" "}
                file{fileCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Creator Section */}
          <div className="properties-section">
            <div className="properties-section-title">Created By</div>
            {loading ? (
              <div className="properties-loading">
                <FaSpinner className="spinner" /> Loading...
              </div>
            ) : creator ? (
              <>
                <div className="properties-row">
                  <span className="properties-label">Name</span>
                  <span className="properties-value">
                    {creator.full_name || "—"}
                    {creator._deleted && (
                      <span className="deleted-badge">Deleted</span>
                    )}
                  </span>
                </div>
                <div className="properties-row">
                  <span className="properties-label">Email</span>
                  <span className="properties-value">
                    {creator.email || "—"}
                  </span>
                </div>
                {creator.department && (
                  <div className="properties-row">
                    <span className="properties-label">Department</span>
                    <span className="properties-value">
                      {creator.department}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="properties-row">
                <span className="properties-value">
                  {folder?.created_by_email || "Unknown"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
