import React, { useState, useMemo, useEffect, useCallback } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { supabase } from "../lib/supabase";
import CustomAlert from "./CustomAlert";
import FileUploader from "./FileUploader";
import LogsModal from "./LogsModal";
import {
  FaUser,
  FaSignOutAlt,
  FaInfoCircle,
  FaTimes,
  FaHistory,
  FaArrowLeft,
} from "react-icons/fa";
import useLockBodyScroll from "../hooks/useLockBodyScroll";
import "../App.css";

export default function Header({
  onBack,
  user,
  onSignOut,
  onUploadStart,
  onUploaded,
  currentFolderId = null,
}) {
  const [profileVisible, setProfileVisible] = useState(false);
  const [logsVisible, setLogsVisible] = useState(false);

  useLockBodyScroll(profileVisible);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    buttons: [],
  });

  const [storageBytes, setStorageBytes] = useState(null);
  const [storageLoading, setStorageLoading] = useState(false);

  const STORAGE_LIMIT_BYTES = 1 * 1024 ** 3; // 1 GB

  const meta = useMemo(() => user?.user_metadata || {}, [user]);

  const displayName = useMemo(() => {
    if (meta.full_name && meta.full_name.trim()) return meta.full_name;
    if (user?.email) {
      const local = user.email.split("@")[0];
      return local
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return "User";
  }, [meta, user]);

  const avatarLetter = useMemo(() => {
    return displayName ? displayName.trim().charAt(0).toUpperCase() : "?";
  }, [displayName]);

  const showAlert = ({ title, message, buttons }) => {
    setAlertConfig({
      title,
      message,
      buttons: buttons || [{ text: "OK", style: "default", onPress: () => {} }],
    });
    setAlertVisible(true);
  };

  const confirmSignOut = () => {
    showAlert({
      title: "Sign out",
      message: "Are you sure you want to sign out?",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            setProfileVisible(false);
            if (onSignOut) await onSignOut();
          },
        },
      ],
    });
  };

  const humanBytes = (bytes) => {
    if (bytes === null || bytes === undefined) return "—";
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB", "PB"];
    let v = Number(bytes);
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
      v = v / 1024;
      i++;
    }
    const formatted = v % 1 === 0 ? String(v) : v.toFixed(2);
    return `${formatted} ${units[i]}`;
  };

  const fetchStorageUsage = useCallback(async () => {
    setStorageLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_storage_bytes");
      if (error) {
        // console.warn("get_storage_bytes rpc error", error);
        setStorageBytes(null);
        return;
      }
      let value = Number(data);
      if (isNaN(value)) value = null;
      setStorageBytes(value);
    } catch (e) {
      console.warn("fetchStorageUsage failed", e);
      setStorageBytes(null);
    } finally {
      setStorageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStorageUsage();
  }, [fetchStorageUsage]);

  const remainingBytes =
    storageBytes === null || STORAGE_LIMIT_BYTES === null
      ? null
      : STORAGE_LIMIT_BYTES - storageBytes;

  const usedStorage = storageBytes || 0;
  const totalStorage = STORAGE_LIMIT_BYTES;
  const usagePercent = totalStorage
    ? Math.min(100, Math.max(0, (usedStorage / totalStorage) * 100)).toFixed(1)
    : 0;

  const menuItems = [
    {
      id: "logout",
      label: "Sign Out",
      icon: <FaSignOutAlt />,
      action: confirmSignOut,
      danger: true,
    },
  ];

  return (
    <>
      <div className="header-container">
        <OverlayTrigger
          placement="bottom"
          delay={{ show: 400, hide: 100 }}
          overlay={<Tooltip id="tooltip-back">Back</Tooltip>}
        >
          <button
            className="logs-badge"
            style={{ padding: 10, fontSize: 20 }}
            onClick={onBack}
          >
            <FaArrowLeft color="white" />
          </button>
        </OverlayTrigger>
        <div
          className="storage-badge"
          onClick={fetchStorageUsage}
          title="Refresh Storage"
        >
          {storageLoading
            ? "Loading…"
            : remainingBytes === null
            ? "—"
            : `${humanBytes(remainingBytes)} left`}
        </div>

        <div
          className="logs-badge"
          onClick={() => setLogsVisible(true)}
          title="View Logs"
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FaHistory />
          Logs
        </div>
        <div title="Upload File">
          <FileUploader
            onUploadStart={onUploadStart}
            onUploaded={onUploaded}
            currentFolderId={currentFolderId}
          />
        </div>
        <div
          className="avatar-circle"
          onClick={() => setProfileVisible(true)}
          title="Profile"
        >
          {avatarLetter}
        </div>
      </div>

      {profileVisible && (
        <div className="modal-overlay">
          <div className="modal-box profile-modal">
            <div className="modal-header">
              <h2>Your Profile</h2>
              <button
                onClick={() => setProfileVisible(false)}
                className="close-button"
              >
                <FaTimes />
              </button>
            </div>

            <div className="profile-content">
              <div className="user-section">
                <div className="avatar-container">
                  <div className="avatar-placeholder large">
                    <span className="avatar-text">{avatarLetter}</span>
                  </div>
                </div>
                <div className="user-details">
                  <h3 className="user-name">{displayName}</h3>
                  <p className="user-email">{user?.email}</p>
                </div>
              </div>

              <div className="storage-section">
                <div className="storage-info">
                  <span className="storage-label">Storage Usage</span>
                  <span className="storage-value">{usagePercent}%</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${usagePercent}%`,
                      backgroundColor:
                        usagePercent > 90 ? "#f44336" : "#4caf50",
                    }}
                  />
                </div>
                <p className="storage-text">
                  {humanBytes(usedStorage)} of {humanBytes(totalStorage)} used
                </p>
              </div>

              <div className="user-info-section">
                <div className="info-item">
                  <span className="info-label">Age</span>
                  <span className="info-value">{meta.age || "—"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{meta.phone || "—"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Address</span>
                  <span className="info-value">{meta.address || "—"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">BPS</span>
                  <span className="info-value">{meta.bps || "—"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Grid Address</span>
                  <span className="info-value">{meta.grid_address || "—"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Department</span>
                  <span className="info-value">{meta.department || "—"}</span>
                </div>
              </div>

              <div className="menu-section">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    className={`menu-item ${item.danger ? "danger" : ""}`}
                    onClick={item.action}
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: "1rem",
                    }}
                  >
                    <span className="menu-label">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onRequestClose={() => setAlertVisible(false)}
      />

      <LogsModal visible={logsVisible} onClose={() => setLogsVisible(false)} />
    </>
  );
}
