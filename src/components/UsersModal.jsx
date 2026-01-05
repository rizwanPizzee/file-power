import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import {
  FaTimes,
  FaSearch,
  FaTimes as FaClear,
  FaArrowLeft,
  FaUsers,
  FaUser,
} from "react-icons/fa";
import useLockBodyScroll from "../hooks/useLockBodyScroll";
import "./UsersModal.css";

export default function UsersModal({ visible, onClose }) {
  useLockBodyScroll(visible);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    if (visible) {
      fetchUsers();
    } else {
      setUsers([]);
      setSelectedUser(null);
      setCurrentUserId(null);
      setSearchQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const fetchCurrentUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setCurrentUserId(data.user.id);
      }
    } catch (err) {
      console.warn("fetchCurrentUser error:", err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      await fetchCurrentUser();

      const [activeRes, deletedRes] = await Promise.all([
        supabase
          .from("safe_auth_users")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("deleted_auth_users")
          .select("*")
          .order("deleted_at", { ascending: false }),
      ]);

      if (activeRes.error) throw activeRes.error;
      if (deletedRes.error) throw deletedRes.error;

      const active = activeRes.data ?? [];
      const deleted = deletedRes.data ?? [];

      const map = new Map();

      // Process deleted users
      deleted.forEach((d) => {
        const meta = d.user_metadata || {};
        const userObj = {
          id: d.id,
          email: d.email,
          full_name: meta.full_name || null,
          age: meta.age || null,
          phone: meta.phone || null,
          address: meta.address || null,
          bps: meta.bps || null,
          grid_address: meta.grid_address || null,
          department: meta.department || null,
          created_at: d.created_at ?? null,
          deleted_at: d.deleted_at ?? null,
          _deleted: true,
        };
        map.set(d.email ?? d.id, userObj);
        if (d.id) map.set(d.id, userObj);
      });

      // Process active users
      active.forEach((a) => {
        const keyEmail = a.email ?? a.id;
        const keyId = a.id;

        if (map.has(keyEmail) || (keyId && map.has(keyId))) {
          return;
        }

        const userObj = {
          id: a.id,
          email: a.email,
          full_name:
            a.full_name || (a.user_metadata?.full_name ?? null) || null,
          age: a.age || a.user_metadata?.age || null,
          phone: a.phone || a.user_metadata?.phone || null,
          address: a.address || a.user_metadata?.address || null,
          bps: a.bps || a.user_metadata?.bps || null,
          grid_address: a.grid_address || a.user_metadata?.grid_address || null,
          department: a.department || a.user_metadata?.department || null,
          created_at: a.created_at ?? null,
          _deleted: false,
        };

        map.set(keyEmail, userObj);
        if (a.id) map.set(a.id, userObj);
      });

      const seen = new Set();
      const combined = [];
      for (const value of map.values()) {
        const uniqueKey = value.id ?? value.email;
        if (seen.has(uniqueKey)) continue;
        seen.add(uniqueKey);
        combined.push(value);
      }

      combined.sort((x, y) => {
        const tx = x.deleted_at ?? x.created_at ?? 0;
        const ty = y.deleted_at ?? y.created_at ?? 0;
        return new Date(ty) - new Date(tx);
      });

      setUsers(combined);
    } catch (err) {
      console.warn("fetchUsers error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const fullName = (u.full_name || "").toString().toLowerCase();
      const email = (u.email || "").toString().toLowerCase();
      const emailLocal = (u.email || "").split("@")[0].toLowerCase();
      const address = (u.address || "").toString().toLowerCase();
      const grid = (u.grid_address || "").toString().toLowerCase();
      const dept = (u.department || "").toString().toLowerCase();
      const bps = (u.bps || "").toString().toLowerCase();

      return (
        fullName.includes(q) ||
        email.includes(q) ||
        emailLocal.includes(q) ||
        address.includes(q) ||
        grid.includes(q) ||
        dept.includes(q) ||
        bps.includes(q)
      );
    });
  }, [users, searchQuery]);

  const renderDetail = (label, value) => {
    if (!value) return null;
    return (
      <div className="detail-row">
        <div className="detail-label">{label}</div>
        <div className="detail-value">{value}</div>
      </div>
    );
  };

  const renderDetailView = () => {
    const u = selectedUser;
    if (!u) return null;

    const displayName =
      (u.full_name && u.full_name.trim()) ||
      (u.email ? u.email.split("@")[0] : "User");
    const isMe = currentUserId && u.id === currentUserId;

    return (
      <div className="user-detail-view">
        <div className="detail-header">
          <button
            className="back-button"
            onClick={() => setSelectedUser(null)}
            title="Back to list"
          >
            <FaArrowLeft size={16} />
          </button>
          <span className="detail-title">User Details</span>
        </div>

        <div className="detail-content">
          <div className="large-avatar-container">
            <div className="large-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="detail-main-name">
              {displayName}
              {isMe && (
                <span
                  className="badge-you"
                  style={{
                    marginLeft: 8,
                    fontSize: "0.8rem",
                    verticalAlign: "middle",
                  }}
                >
                  You
                </span>
              )}
            </div>
            <div className="detail-main-email">{u.email || "—"}</div>
            {u._deleted && (
              <div className="detail-deleted-at">
                Deleted at:{" "}
                {u.deleted_at ? new Date(u.deleted_at).toLocaleString() : "—"}
              </div>
            )}
          </div>

          <div className="detail-divider" />

          {renderDetail("Age", u.age)}
          {renderDetail("Phone", u.phone)}
          {renderDetail("Address", u.address)}
          {renderDetail("BPS", u.bps)}
          {renderDetail("Grid Address", u.grid_address)}
          {renderDetail("Department", u.department)}
          {renderDetail(
            "Account Created",
            u.created_at ? new Date(u.created_at).toLocaleString() : null
          )}
        </div>
      </div>
    );
  };

  if (!visible) return null;

  return (
    <div className="users-overlay">
      <div className="users-modal-container">
        {/* Header */}
        <div className="users-modal-header">
          <div className="header-title-section">
            <div className="header-icon-wrapper">
              <FaUsers size={20} />
            </div>
            <div className="header-text">
              <h2>Users</h2>
              <span className="user-count">
                {filteredUsers.length} users found
              </span>
            </div>
          </div>
          <button onClick={onClose} className="close-button-modern">
            <FaTimes size={16} />
          </button>
        </div>

        {/* Content */}
        {selectedUser ? (
          <div className="users-list-container">{renderDetailView()}</div>
        ) : (
          <>
            {/* Controls */}
            <div className="users-controls">
              <div className="search-row">
                <div className="search-input-wrapper">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by name, BPS, department..."
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
              </div>
            </div>

            {/* List */}
            <div className="users-list-container">
              {loading ? (
                <div className="users-list skeleton-loading">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton-row">
                      <div className="skeleton-avatar" />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton-text" />
                        <div className="skeleton-text short" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="empty-state-modern">
                  <div className="empty-icon-wrapper">
                    <FaUser size={40} />
                  </div>
                  <h3>No Users Found</h3>
                  <p>
                    {searchQuery
                      ? `No results for "${searchQuery}"`
                      : "No user records available."}
                  </p>
                </div>
              ) : (
                <div className="users-list">
                  {filteredUsers.map((u) => {
                    const displayName =
                      (u.full_name && u.full_name.trim()) ||
                      (u.email ? u.email.split("@")[0] : "User");
                    const isMe = currentUserId && u.id === currentUserId;

                    return (
                      <div
                        key={u.id || u.email}
                        className="user-card"
                        onClick={() => setSelectedUser(u)}
                      >
                        <div className="user-card-avatar">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-card-info">
                          <div className="user-card-name">
                            {displayName}
                            {u._deleted && (
                              <span className="badge-deleted">Deleted</span>
                            )}
                            {isMe && <span className="badge-you">You</span>}
                          </div>
                          <div className="user-card-email">
                            {u.email || "—"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
