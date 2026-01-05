import React, { useMemo } from "react";
import "../App.css";
import { FaEllipsisV } from "react-icons/fa";
export default function SkeletonItem({ layout = "grid" }) {
  const randomWidth = useMemo(
    // eslint-disable-next-line react-hooks/purity
    () => Math.floor(Math.random() * (300 - 120 + 1)) + 120,
    []
  );

  const randomWidth1 = useMemo(
    // eslint-disable-next-line react-hooks/purity
    () => Math.floor(Math.random() * (98 - 70 + 1)) + 70,
    []
  );

  const randomWidth2 = useMemo(
    // eslint-disable-next-line react-hooks/purity
    () => Math.floor(Math.random() * (30 - 50 + 1)) + 50,
    []
  );

  if (layout === "list") {
    return (
      <div className="skeleton-list-card">
        <div className="skeleton-shimmer skeleton-list-icon"></div>
        <div className="skeleton-list-info">
          <div
            className="skeleton-shimmer skeleton-text-md profile-text"
            style={{
              width: `${randomWidth}px`,
            }}
          ></div>
          <div className="skeleton-list-meta">
            <div className="skeleton-shimmer skeleton-text-sm meta-item skeleton-text-700px"></div>
            <div
              className="skeleton-shimmer skeleton-text-sm meta-item skeleton-text-700px"
              style={{
                width: "70px",
                marginRight: "10px",
                marginLeft: "20px",
              }}
            ></div>
            <div className="skeleton-shimmer vertical-bar-skeleton" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="skeleton-card">
      <div className="skeleton-shimmer skeleton-preview"></div>
      <div className="skeleton-info">
        <div
          className="skeleton-shimmer skeleton-text-lg"
          style={{
            width: `${randomWidth1}%`,
          }}
        ></div>
        <div
          className="skeleton-shimmer skeleton-text-sm"
          style={{
            width: `${randomWidth2}%`,
          }}
        ></div>
        <div className="skeleton-shimmer skeleton-text-l"></div>
      </div>
    </div>
  );
}
