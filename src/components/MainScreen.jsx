import React, { useRef } from "react";
import Header from "./Header";
import FilesScreen from "./FilesScreen";
import "../App.css";

export default function MainScreen({ session, onSignOut, onGoToLanding }) {
  const filesScreenRef = useRef(null);

  const handleUploadStart = () => {
    // Optional: show global loading or something
  };

  const handleUploaded = (fileRow, publicUrl, tempId, error) => {
    if (filesScreenRef.current) {
      filesScreenRef.current.handleUploaded(fileRow, publicUrl, tempId, error);
    }
  };

  return (
    <div className="main-screen">
      <Header
        onBack={onGoToLanding}
        user={session?.user}
        onSignOut={onSignOut}
        onUploadStart={handleUploadStart}
        onUploaded={handleUploaded}
      />
      <div className="content-area">
        <FilesScreen ref={filesScreenRef} />
      </div>
    </div>
  );
}
