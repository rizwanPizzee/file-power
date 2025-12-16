import React, { useRef, useEffect, useState } from "react";
import Header from "./Header";
import FilesScreen from "./FilesScreen";
import "../App.css";

export default function MainScreen({ session, onSignOut, onGoToLanding }) {
  const filesScreenRef = useRef(null);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFolderName, setCurrentFolderName] = useState(null);

  const handleUploadStart = () => {};

  const handleUploaded = (fileRow, publicUrl, tempId, error) => {
    if (filesScreenRef.current) {
      // Pass the current folder name to the handler for proper logging
      filesScreenRef.current.handleUploaded(
        fileRow,
        publicUrl,
        tempId,
        error,
        currentFolderName
      );
    }
  };

  // Get currentFolderId and currentFolderName from FilesScreen when it changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (filesScreenRef.current) {
        if (filesScreenRef.current.currentFolderId !== undefined) {
          setCurrentFolderId(filesScreenRef.current.currentFolderId);
        }
        if (filesScreenRef.current.currentFolderName !== undefined) {
          setCurrentFolderName(filesScreenRef.current.currentFolderName);
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

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
        currentFolderId={currentFolderId}
      />
      <div className="content-area">
        <FilesScreen ref={filesScreenRef} />
      </div>
    </div>
  );
}
