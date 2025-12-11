import React, { useRef, useEffect } from "react";
import Header from "./Header";
import FilesScreen from "./FilesScreen";
import "../App.css";

export default function MainScreen({ session, onSignOut, onGoToLanding }) {
  const filesScreenRef = useRef(null);

  const handleUploadStart = () => {};

  const handleUploaded = (fileRow, publicUrl, tempId, error) => {
    if (filesScreenRef.current) {
      filesScreenRef.current.handleUploaded(fileRow, publicUrl, tempId, error);
    }
  };

  useEffect(() => {
    document.title = "File Power";
  }, []);

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
