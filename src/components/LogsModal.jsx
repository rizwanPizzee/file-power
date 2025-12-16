import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import {
  FaTimes,
  FaCloudUploadAlt,
  FaTrash,
  FaPencilAlt,
  FaSearch,
  FaTimes as FaClear,
  FaFolder,
  FaArrowsAlt,
  FaHistory,
  FaChevronDown,
  FaFilter,
  FaClock,
  FaUser,
  FaFile,
  FaChevronRight,
} from "react-icons/fa";
import useLockBodyScroll from "../hooks/useLockBodyScroll";
import "./LogsModal.css";
import LogsSkeleton from "./LogsSkeleton";

export default function LogsModal({ visible, onClose }) {
  useLockBodyScroll(visible);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayCount, setDisplayCount] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const fetchLogs = async (searchTerm = "") => {
    setLoading(true);
    try {
      let query = supabase
        .from("user_file_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (!searchTerm || searchTerm.trim() === "") {
        query = query.limit(5000);
      }

      const { data, error } = await query;

      if (error) throw error;
      const logsData = data || [];

      const emails = logsData
        .map((l) => l.user_email)
        .filter((e) => e && typeof e === "string");
      const uniqueEmails = [...new Set(emails)];

      const profiles = await Promise.all(
        uniqueEmails.map((email) => fetchUserByEmail(email))
      );

      const nameMap = {};
      profiles.forEach((p) => {
        if (p && p.email) {
          nameMap[p.email] = p.full_name || p.email;
        }
      });

      // Attach user_name to each log
      const enriched = logsData.map((log) => {
        const email = log.user_email;
        const derived =
          (email && nameMap[email]) ||
          extractNameFromEmail(email) ||
          email ||
          "Unknown";
        return {
          ...log,
          user_name: derived,
        };
      });

      setLogs(enriched);
    } catch (e) {
      console.warn("fetchLogs failed", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserByEmail = async (email) => {
    if (!email) return null;
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
      const u = activeRes.data?.[0] || deletedRes.data?.[0] || null;
      if (!u)
        return { email, full_name: extractNameFromEmail(email) || "Unknown" };
      const meta = u.user_metadata || {};
      return {
        full_name:
          meta.full_name ||
          u.full_name ||
          extractNameFromEmail(email) ||
          "Unknown",
        email: u.email,
      };
    } catch (e) {
      console.warn("fetchUserByEmail failed", e);
      return { email, full_name: extractNameFromEmail(email) || "Unknown" };
    }
  };

  const extractNameFromEmail = (email) => {
    if (!email || typeof email !== "string") return "";
    const local = email.split("@")[0];
    return local.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const prettyBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let v = Number(bytes);
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
      v = v / 1024;
      i++;
    }
    const formatted = v % 1 === 0 ? String(v) : v.toFixed(2);
    return `${formatted} ${units[i]}`;
  };

  const counts = useMemo(() => {
    const total = logs.length;
    const uploads = logs.filter((l) => l.action === "UPLOAD").length;
    const deletes = logs.filter((l) => l.action === "DELETE").length;
    const renames = logs.filter((l) => l.action === "RENAME").length;
    const createFolders = logs.filter(
      (l) => l.action === "CREATE_FOLDER"
    ).length;
    const moves = logs.filter((l) => l.action === "MOVE").length;
    const renameFolders = logs.filter(
      (l) => l.action === "RENAME_FOLDER"
    ).length;
    const deleteFolders = logs.filter(
      (l) => l.action === "DELETE_FOLDER"
    ).length;
    return {
      total,
      uploads,
      deletes,
      renames,
      createFolders,
      moves,
      renameFolders,
      deleteFolders,
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (filter === "ALL") return logs;
    if (filter === "UPLOAD") return logs.filter((l) => l.action === "UPLOAD");
    if (filter === "DELETE") return logs.filter((l) => l.action === "DELETE");
    if (filter === "RENAME") return logs.filter((l) => l.action === "RENAME");
    if (filter === "CREATE_FOLDER")
      return logs.filter((l) => l.action === "CREATE_FOLDER");
    if (filter === "MOVE") return logs.filter((l) => l.action === "MOVE");
    if (filter === "RENAME_FOLDER")
      return logs.filter((l) => l.action === "RENAME_FOLDER");
    if (filter === "DELETE_FOLDER")
      return logs.filter((l) => l.action === "DELETE_FOLDER");
    return logs;
  }, [logs, filter]);

  const matchesSearch = (item, q) => {
    if (!q || q.trim() === "") return true;
    const qq = q.trim().toLowerCase();

    const fileName = (item.file_name || "").toString().toLowerCase();
    const userEmail = (item.user_email || "").toString().toLowerCase();
    const userName = (item.user_name || "").toString().toLowerCase();
    const fileType = (item.file_type || "").toString().toLowerCase();
    const action = (item.action || "").toString().toLowerCase();
    const oldFileName = (item.old_file_name || "").toString().toLowerCase();
    const newFileName = (item.new_file_name || "").toString().toLowerCase();
    const filePath = (item.file_path || "").toString().toLowerCase();

    // Add date/time search support
    let dateStrings = "";
    if (item.created_at) {
      const date = new Date(item.created_at);

      // Format date in multiple common formats for searching
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      // Common date formats
      const ddmmyyyy = `${day}/${month}/${year}`; // 25/11/2025
      const mmddyyyy = `${month}/${day}/${year}`; // 11/25/2025
      const yyyymmdd = `${year}-${month}-${day}`; // 2025-11-25
      const localeDate = date.toLocaleDateString().toLowerCase(); // Browser locale format
      const localeTime = date.toLocaleTimeString().toLowerCase(); // Time format
      const localeDateTime = date.toLocaleString().toLowerCase(); // Full date+time

      dateStrings = `${ddmmyyyy} ${mmddyyyy} ${yyyymmdd} ${localeDate} ${localeTime} ${localeDateTime}`;
    }

    const anyText = `${fileName} ${userEmail} ${userName} ${fileType} ${action} ${oldFileName} ${newFileName} ${filePath} ${dateStrings}`;

    return anyText.indexOf(qq) !== -1;
  };

  const searchedLogs = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === "") return filteredLogs;
    return filteredLogs.filter((l) => matchesSearch(l, searchQuery));
  }, [filteredLogs, searchQuery]);

  const displayedLogs = useMemo(() => {
    return searchedLogs.slice(0, displayCount);
  }, [searchedLogs, displayCount]);

  useEffect(() => {
    setHasMore(displayCount < searchedLogs.length);
  }, [displayCount, searchedLogs]);

  // Reset displayCount when search query or filter changes
  useEffect(() => {
    setDisplayCount(20);
  }, [searchQuery, filter]);

  // Fetch logs when search query changes (with debounce)
  useEffect(() => {
    if (!visible) return;

    const timeoutId = setTimeout(() => {
      fetchLogs(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, visible]);

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + 20);
  };

  const getActionConfig = (action) => {
    switch (action) {
      case "UPLOAD":
        return {
          color: "#4caf50",
          bgColor: "rgba(76, 175, 80, 0.15)",
          Icon: FaCloudUploadAlt,
          label: "Uploaded",
        };
      case "DELETE":
        return {
          color: "#f44336",
          bgColor: "rgba(244, 67, 54, 0.15)",
          Icon: FaTrash,
          label: "Deleted",
        };
      case "RENAME":
        return {
          color: "#ff9800",
          bgColor: "rgba(255, 152, 0, 0.15)",
          Icon: FaPencilAlt,
          label: "Renamed",
        };
      case "CREATE_FOLDER":
        return {
          color: "#2196f3",
          bgColor: "rgba(33, 150, 243, 0.15)",
          Icon: FaFolder,
          label: "Created Folder",
        };
      case "MOVE":
        return {
          color: "#9c27b0",
          bgColor: "rgba(156, 39, 176, 0.15)",
          Icon: FaArrowsAlt,
          label: "Moved",
        };
      case "RENAME_FOLDER":
        return {
          color: "#00bcd4",
          bgColor: "rgba(0, 188, 212, 0.15)",
          Icon: FaFolder,
          label: "Renamed Folder",
        };
      case "DELETE_FOLDER":
        return {
          color: "#e91e63",
          bgColor: "rgba(233, 30, 99, 0.15)",
          Icon: FaFolder,
          label: "Deleted Folder",
        };
      default:
        return {
          color: "#4caf50",
          bgColor: "rgba(76, 175, 80, 0.15)",
          Icon: FaCloudUploadAlt,
          label: action,
        };
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  // Helper function to extract folder name from path
  // Handles both old path format (uuid/folder/file) and new format (folder name directly)
  const getFolderNameFromPath = (filePath) => {
    if (!filePath) return "Root";
    if (filePath === "root" || filePath === "Root") return "Root";

    // If it's a simple folder name (no slashes), return it
    if (!filePath.includes("/")) {
      return filePath;
    }

    // Try to extract folder name from path structure
    // Old format might be: user_id/folder_name/filename or folder_name/filename
    const parts = filePath.split("/").filter(Boolean);

    // If we have 2+ parts and the last part looks like a filename (has extension)
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      // Check if last part appears to be a filename
      if (lastPart.includes(".")) {
        // Return the second-to-last part as folder name
        return parts[parts.length - 2] || "Root";
      }
    }

    // Return the last part or Root
    return parts[parts.length - 1] || "Root";
  };

  const renderLogItem = (item, index) => {
    const {
      color,
      bgColor,
      Icon: IconComponent,
      label,
    } = getActionConfig(item.action);

    const isRename = item.action === "RENAME";
    const isRenameFolder = item.action === "RENAME_FOLDER";
    const isMove = item.action === "MOVE";
    const isCreateFolder = item.action === "CREATE_FOLDER";
    const isDeleteFolder = item.action === "DELETE_FOLDER";
    const isUpload = item.action === "UPLOAD";
    const isDelete = item.action === "DELETE";

    const showDateHeader = (() => {
      if (index === 0) return true;
      const prev = displayedLogs[index - 1];
      if (!prev) return true;
      const prevDate = new Date(prev.created_at).toDateString();
      const thisDate = new Date(item.created_at).toDateString();
      return prevDate !== thisDate;
    })();

    return (
      <div key={item.id || index} className="timeline-item-wrapper">
        {showDateHeader && (
          <div className="timeline-date-header">
            <div className="timeline-date-badge">
              <FaClock size={12} />
              <span>{formatDate(item.created_at)}</span>
            </div>
          </div>
        )}

        <div className="timeline-item">
          {/* Timeline connector */}
          <div className="timeline-connector">
            <div
              className="timeline-dot"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 12px ${color}40`,
              }}
            >
              <IconComponent size={12} color="#fff" />
            </div>
            <div
              className="timeline-line"
              style={{ backgroundColor: `${color}30` }}
            ></div>
          </div>

          {/* Card content */}
          <div className="timeline-card" style={{ "--accent-color": color }}>
            {/* Card Header */}
            <div className="timeline-card-header">
              <div className="timeline-user-info">
                <div
                  className="timeline-avatar"
                  style={{ backgroundColor: bgColor }}
                >
                  <FaUser size={10} color={color} />
                </div>
                <span className="timeline-username">
                  {item.user_name || item.user_email || "Unknown"}
                </span>
              </div>
              <div className="timeline-time">
                <FaClock size={10} />
                <span>{formatTime(item.created_at)}</span>
              </div>
            </div>

            {/* Action Badge */}
            <div
              className="timeline-action-badge"
              style={{ backgroundColor: bgColor, color: color }}
            >
              <IconComponent size={12} />
              <span>{label}</span>
            </div>

            {/* Details Section */}
            <div className="timeline-details">
              {(isRename || isRenameFolder) &&
              item.old_file_name &&
              item.new_file_name ? (
                <div className="timeline-rename-info">
                  <div className="rename-flow">
                    <span className="rename-old">{item.old_file_name}</span>
                    <FaChevronRight size={10} className="rename-arrow" />
                    <span className="rename-new">{item.new_file_name}</span>
                  </div>
                </div>
              ) : isMove ? (
                <div className="timeline-move-info">
                  <div className="move-file-name">
                    <FaFile size={11} />
                    <span>{item.file_name || "–"}</span>
                  </div>
                  <div className="move-path-flow">
                    <span className="path-badge from">
                      {item.old_file_name === "root"
                        ? "Root"
                        : item.old_file_name || "Root"}
                    </span>
                    <FaChevronRight size={10} className="path-arrow" />
                    <span className="path-badge to">
                      {item.new_file_name === "root"
                        ? "Root"
                        : item.new_file_name || "Root"}
                    </span>
                  </div>
                </div>
              ) : isCreateFolder ? (
                <div className="timeline-folder-info">
                  <div className="folder-name-row">
                    <FaFolder size={12} color="#2196f3" />
                    <span className="folder-name">{item.file_name || "–"}</span>
                  </div>
                  <div className="folder-location">
                    <span className="location-label">In</span>
                    <span
                      className="location-value"
                      style={{ color: "#2196f3" }}
                    >
                      {item.file_path === "root"
                        ? "Root"
                        : item.file_path || "Root"}
                    </span>
                  </div>
                </div>
              ) : isDeleteFolder ? (
                <div className="timeline-folder-info">
                  <div className="folder-name-row">
                    <FaFolder size={12} color="#e91e63" />
                    <span className="folder-name">{item.file_name || "–"}</span>
                  </div>
                  <div className="folder-location">
                    <span className="location-label">Was in</span>
                    <span
                      className="location-value"
                      style={{ color: "#e91e63" }}
                    >
                      {item.file_path === "root"
                        ? "Root"
                        : item.file_path || "Root"}
                    </span>
                  </div>
                </div>
              ) : isDelete ? (
                <div className="timeline-file-info">
                  <div className="file-name-row">
                    <FaFile size={11} />
                    <span className="file-name">{item.file_name || "–"}</span>
                  </div>
                  <div className="file-location">
                    <span className="location-label">Was in</span>
                    <span
                      className="location-value"
                      style={{ color: "#f44336" }}
                    >
                      {getFolderNameFromPath(item.file_path)}
                    </span>
                  </div>
                </div>
              ) : isUpload ? (
                <div className="timeline-file-info">
                  <div className="file-name-row">
                    <FaFile size={11} />
                    <span className="file-name">{item.file_name || "–"}</span>
                  </div>
                  <div className="file-location">
                    <span className="location-label">To</span>
                    <span
                      className="location-value"
                      style={{ color: "#4caf50" }}
                    >
                      {getFolderNameFromPath(item.file_path)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="timeline-file-info">
                  <div className="file-name-row">
                    <FaFile size={11} />
                    <span className="file-name">{item.file_name || "–"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Meta Info */}
            {item.file_size && (
              <div className="timeline-meta">
                <span className="meta-chip">{prettyBytes(item.file_size)}</span>
                <span className="meta-chip">{item.file_type || "-"}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const filterOptions = [
    { key: "ALL", label: "All", count: counts.total },
    {
      key: "UPLOAD",
      label: "Uploads",
      count: counts.uploads,
      color: "#4caf50",
    },
    {
      key: "DELETE",
      label: "Deletes",
      count: counts.deletes,
      color: "#f44336",
    },
    {
      key: "RENAME",
      label: "Renames",
      count: counts.renames,
      color: "#ff9800",
    },
    {
      key: "CREATE_FOLDER",
      label: "Folders",
      count: counts.createFolders,
      color: "#2196f3",
    },
    { key: "MOVE", label: "Moves", count: counts.moves, color: "#9c27b0" },
    {
      key: "RENAME_FOLDER",
      label: "Folder Renames",
      count: counts.renameFolders,
      color: "#00bcd4",
    },
    {
      key: "DELETE_FOLDER",
      label: "Folder Deletes",
      count: counts.deleteFolders,
      color: "#e91e63",
    },
  ];

  if (!visible) return null;

  return (
    <div className="logs-overlay">
      <div className="logs-modal-container">
        {/* Glassmorphic Header */}
        <div className="logs-modal-header">
          <div className="header-title-section">
            <div className="header-icon-wrapper">
              <FaHistory size={18} />
            </div>
            <div className="header-text">
              <h2>Activity Timeline</h2>
              <span className="activity-count">
                {searchedLogs.length.toLocaleString()} activities
                {filter !== "ALL" && (
                  <span className="filter-indicator">
                    • {filter.replace("_", " ").toLowerCase()}
                  </span>
                )}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="close-button-modern">
            <FaTimes size={16} />
          </button>
        </div>

        {/* Search & Filter Section */}
        <div className="logs-controls">
          <div className="search-row">
            <div className="search-input-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-modern"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="search-clear-btn"
                >
                  <FaClear size={12} />
                </button>
              )}
            </div>
            <button
              className={`filter-toggle-btn ${showFilters ? "active" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter size={12} />
              <FaChevronDown
                size={10}
                className={`chevron-icon ${showFilters ? "rotated" : ""}`}
              />
            </button>
          </div>

          {/* Filter Pills */}
          <div className={`filters-panel ${showFilters ? "expanded" : ""}`}>
            <div className="filters-scroll">
              {filterOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setFilter(opt.key)}
                  className={`filter-chip ${
                    filter === opt.key ? "active" : ""
                  }`}
                  style={
                    filter === opt.key && opt.color
                      ? {
                          backgroundColor: opt.color,
                          borderColor: opt.color,
                        }
                      : {}
                  }
                >
                  <span className="filter-label">{opt.label}</span>
                  <span className="filter-count">{opt.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="logs-timeline-container">
          {loading ? (
            <div className="skeleton-list">
              <div className="skeleton-shimmer skeleton-date"></div>
              {Array.from({ length: 8 }).map((_, index) => (
                <LogsSkeleton key={`log-skel-${index}`} />
              ))}
            </div>
          ) : displayedLogs.length === 0 ? (
            <div className="empty-state-modern">
              <div className="empty-icon-wrapper">
                <FaHistory size={40} />
              </div>
              <h3>No Activity Found</h3>
              <p>
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : "There are no logs to display yet."}
              </p>
            </div>
          ) : (
            <div className="timeline-list">
              {displayedLogs.map((log, index) => renderLogItem(log, index))}
              {hasMore && (
                <button onClick={handleLoadMore} className="load-more-btn">
                  <span>Load More</span>
                  <span className="remaining-count">
                    {searchedLogs.length - displayCount} remaining
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
