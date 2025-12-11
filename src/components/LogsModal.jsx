import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import {
  FaTimes,
  FaCloudUploadAlt,
  FaTrash,
  FaPencilAlt,
  FaSearch,
  FaTimes as FaClear,
} from "react-icons/fa";
import useLockBodyScroll from "../hooks/useLockBodyScroll";
import "../App.css";

export default function LogsModal({ visible, onClose }) {
  useLockBodyScroll(visible);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayCount, setDisplayCount] = useState(20);
  const [hasMore, setHasMore] = useState(false);

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
    return { total, uploads, deletes, renames };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (filter === "ALL") return logs;
    if (filter === "UPLOAD") return logs.filter((l) => l.action === "UPLOAD");
    if (filter === "DELETE") return logs.filter((l) => l.action === "DELETE");
    if (filter === "RENAME") return logs.filter((l) => l.action === "RENAME");
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

    const anyText = `${fileName} ${userEmail} ${userName} ${fileType} ${action} ${oldFileName} ${newFileName} ${dateStrings}`;

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

  const renderLogItem = (item, index) => {
    const isDelete = item.action === "DELETE";
    const isRename = item.action === "RENAME";

    let color = "#4caf50"; // green for upload
    let IconComponent = FaCloudUploadAlt;

    if (isDelete) {
      color = "#f44336";
      IconComponent = FaTrash;
    } else if (isRename) {
      color = "#ff9800";
      IconComponent = FaPencilAlt;
    }

    const showDateHeader = (() => {
      if (index === 0) return true;
      const prev = displayedLogs[index - 1];
      if (!prev) return true;
      const prevDate = new Date(prev.created_at).toDateString();
      const thisDate = new Date(item.created_at).toDateString();
      return prevDate !== thisDate;
    })();

    return (
      <div key={item.id || index}>
        {showDateHeader && (
          <div className="logs-date-header">
            <span className="logs-date-header-text">
              {new Date(item.created_at).toLocaleDateString()}
            </span>
          </div>
        )}

        <div className="logs-row">
          <div className="logs-icon-box" style={{ backgroundColor: color }}>
            <IconComponent size={16} color="#fff" />
          </div>

          <div className="logs-content">
            <div className="logs-header">
              <span className="logs-user-name">
                {item.user_name || item.user_email || "Unknown"}
              </span>
            </div>

            <div
              className="logs-action-badge"
              style={{ backgroundColor: color }}
            >
              <span className="logs-action-text">
                File {item.action} at{" "}
                <span className="logs-time">
                  {new Date(item.created_at).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </span>
            </div>

            <div className="logs-file-row">
              {isRename && item.old_file_name && item.new_file_name ? (
                <span className="logs-file-name">
                  <span style={{ color: "#9aa7b2" }}>{item.old_file_name}</span>
                  <span style={{ color: "#fff" }}> → </span>
                  <span style={{ color: "#fff", fontWeight: "700" }}>
                    {item.new_file_name}
                  </span>
                </span>
              ) : (
                <span className="logs-file-name">{item.file_name || "–"}</span>
              )}
            </div>

            {item.file_size && (
              <div className="logs-meta-row">
                <span className="logs-meta-text">
                  {prettyBytes(item.file_size)}
                </span>
                <span className="logs-meta-text">{item.file_type || "-"}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box logs-modal">
        <div className="modal-header">
          <div>
            <h2>
              Activity Logs
              {filter === "ALL"
                ? searchQuery.trim() !== ""
                  ? ` of "${searchQuery}"`
                  : ""
                : ` of ${filter} ${searchQuery}`}
            </h2>
            <p className="logs-subtitle">
              Showing {displayedLogs.length} of {searchedLogs.length}
            </p>
          </div>
          <button onClick={onClose} className="close-button">
            <FaTimes />
          </button>
        </div>

        <div className="logs-modal-content">
          <div className="logs-search-bar">
            <FaSearch className="logs-search-icon" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="logs-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="logs-clear-btn"
              >
                <FaClear />
              </button>
            )}
          </div>

          <div className="logs-filter-row">
            <button
              onClick={() => setFilter("ALL")}
              className={`logs-chip ${
                filter === "ALL" ? "logs-chip-active" : ""
              }`}
            >
              All ({counts.total})
            </button>
            <button
              onClick={() => setFilter("UPLOAD")}
              className={`logs-chip ${
                filter === "UPLOAD" ? "logs-chip-active" : ""
              }`}
            >
              Uploads ({counts.uploads})
            </button>
            <button
              onClick={() => setFilter("DELETE")}
              className={`logs-chip ${
                filter === "DELETE" ? "logs-chip-active" : ""
              }`}
            >
              Deletes ({counts.deletes})
            </button>
            <button
              onClick={() => setFilter("RENAME")}
              className={`logs-chip ${
                filter === "RENAME" ? "logs-chip-active" : ""
              }`}
            >
              Renames ({counts.renames})
            </button>
          </div>

          <div className="logs-list">
            {loading ? (
              <div className="logs-loading">
                <p>Loading logs...</p>
              </div>
            ) : displayedLogs.length === 0 ? (
              <div className="logs-empty">
                <p>No logs found.</p>
              </div>
            ) : (
              <>
                {displayedLogs.map((log, index) => renderLogItem(log, index))}
                {hasMore && (
                  <button onClick={handleLoadMore} className="logs-load-more">
                    Load More
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
