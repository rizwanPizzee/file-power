import React from "react";
import "../App.css";

export default function SkeletonItem() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-shimmer skeleton-preview"></div>
      <div className="skeleton-info">
        <div className="skeleton-shimmer skeleton-text-lg"></div>
        <div className="skeleton-shimmer skeleton-text-sm"></div>
        <div className="skeleton-shimmer skeleton-text-l"></div>
      </div>
    </div>
  );
}
