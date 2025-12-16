import React from "react";
import "./LogsModal.css";

export default function LogsSkeleton() {
  return (
    <>
      <div className="skeleton-timeline-item">
        {/* Timeline Connector */}

        <div className="skeleton-connector">
          <div className="skeleton-shimmer skeleton-dot"></div>
          <div className="skeleton-shimmer skeleton-line"></div>
        </div>

        {/* Card */}
        <div className="skeleton-card">
          {/* Header */}
          <div className="skeleton-card-header">
            <div className="skeleton-user">
              <div className="skeleton-shimmer skeleton-avatar"></div>
              <div className="skeleton-shimmer skeleton-name"></div>
            </div>
            <div className="skeleton-shimmer skeleton-time"></div>
          </div>

          {/* Action Badge */}
          <div className="skeleton-shimmer skeleton-badge"></div>

          {/* File Info */}
          <div className="skeleton-file-row">
            <div className="skeleton-shimmer skeleton-file-icon"></div>
            <div className="skeleton-shimmer skeleton-file-name"></div>
          </div>

          {/* Meta */}
          <div className="skeleton-meta">
            <div className="skeleton-shimmer skeleton-meta-chip"></div>
            <div className="skeleton-shimmer skeleton-meta-chip"></div>
          </div>
        </div>
      </div>
    </>
  );
}
