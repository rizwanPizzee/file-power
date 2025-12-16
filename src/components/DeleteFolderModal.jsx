import React, { useState, useEffect } from "react";
import { FaTimes, FaSpinner, FaExclamationTriangle } from "react-icons/fa";
import useLockBodyScroll from "../hooks/useLockBodyScroll";
import "../App.css";

export default function DeleteFolderModal({
  visible,
  folder,
  onClose,
  onDelete,
}) {
  useLockBodyScroll(visible);
  const [step, setStep] = useState("confirm"); // confirm, verify, deleting
  const [typedName, setTypedName] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep("confirm");
      setTypedName("");
      setError(null);
    }
  }, [visible]);

  const handleVerify = () => {
    setStep("verify");
  };

  const handleDelete = async () => {
    if (typedName !== folder?.name) return;

    setStep("deleting");
    try {
      await onDelete();
      // The parent component will close the modal upon success
    } catch (err) {
      setStep("verify"); // Go back to verify to show error
      setError(err.message || "Failed to delete folder");
    }
  };

  if (!visible || !folder) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box delete-modal">
        {step === "deleting" ? (
          <div className="modal-content-center">
            <FaSpinner className="spinner large-spinner" />
            <h3>Deleting Folder...</h3>
            <p>Please wait while we delete "{folder.name}" and its contents.</p>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <h3 className="text-danger">Delete Folder</h3>
              <button
                className="close-btn"
                onClick={onClose}
                disabled={step === "deleting"}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              {step === "confirm" ? (
                <>
                  <div className="alert-icon-container">
                    <FaExclamationTriangle className="alert-icon" />
                  </div>
                  <p className="confirm-text">
                    Are you sure you want to delete the folder{" "}
                    <strong>"{folder.name}"</strong>?
                  </p>
                  <p className="sub-text">
                    This action is permanent and cannot be undone. All files and
                    subfolders inside will be permanently deleted.
                  </p>
                </>
              ) : (
                <>
                  <p className="verify-text">
                    To confirm deletion, please type the folder name exactly as
                    it appears:
                  </p>
                  <div className="verify-name-display">{folder.name}</div>
                  <input
                    type="text"
                    className="modal-input verify-input"
                    value={typedName}
                    onChange={(e) => {
                      setTypedName(e.target.value);
                      setError(null);
                    }}
                    placeholder="Type folder name"
                    autoFocus
                    onPaste={(e) => e.preventDefault()}
                  />
                  {error && <p className="error-text">{error}</p>}
                </>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="modal-btn cancel"
                onClick={onClose}
                disabled={step === "deleting"}
              >
                Cancel
              </button>

              {step === "confirm" ? (
                <button className="modal-btn danger" onClick={handleVerify}>
                  Continue
                </button>
              ) : (
                <button
                  className="modal-btn danger"
                  onClick={handleDelete}
                  disabled={typedName !== folder.name}
                >
                  Delete Forever
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
