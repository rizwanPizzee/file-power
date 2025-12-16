import React, { useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useToast } from "./Toast";
import CustomAlert from "./CustomAlert";
import { FaCloudUploadAlt, FaSpinner, FaPlus } from "react-icons/fa";
import { STORAGE_BUCKET } from "../lib/constants";

// Maximum file size limit: 50MB
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const FileUploader = ({
  onUploaded,
  onUploadStart,
  currentFolderId = null,
}) => {
  const [uploading, setUploading] = useState(false);
  const [checkingFile, setCheckingFile] = useState(false);
  const [alert, setAlert] = useState(null);
  const fileInputRef = useRef(null);
  const toast = useToast();
  const abortControllerRef = useRef(null);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    event.target.value = "";

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setAlert({
        title: "File Too Large",
        message: (
          <>
            The file "
            <span style={{ color: "#ff4343ff", fontWeight: "bold" }}>
              {file.name}
            </span>
            " ({formatBytes(file.size)}) exceeds the maximum allowed size of{" "}
            <span style={{ color: "#3b82f6", fontWeight: "bold" }}>
              {MAX_FILE_SIZE_MB} MB
            </span>
            . Please select a smaller file.
          </>
        ),
        buttons: [
          { text: "OK", style: "default", onPress: () => setAlert(null) },
        ],
      });
      return;
    }

    const fileMeta = {
      name: file.name,
      size: file.size,
      mimeType: file.type,
      uri: file,
    };

    try {
      setCheckingFile(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        setCheckingFile(false);
        setAlert({
          title: "Not signed in",
          message: "You must be signed in to upload files.",
          buttons: [{ text: "OK", style: "default" }],
        });
        return;
      }

      // Check if file exists in current folder by name AND folder_id
      let existsQuery = supabase
        .from("files")
        .select("id")
        .eq("name", file.name);

      if (currentFolderId === null) {
        existsQuery = existsQuery.is("folder_id", null);
      } else {
        existsQuery = existsQuery.eq("folder_id", currentFolderId);
      }

      const { data: existingFile } = await existsQuery.single();

      if (existingFile) {
        setCheckingFile(false);
        setAlert({
          title: "File already exists",
          message: (
            <>
              File "
              <span style={{ color: "#ff4343ff", fontWeight: "bold" }}>
                {file.name}
              </span>
              " (Size: {formatBytes(file.size)}) already exists with same name.
            </>
          ),
          buttons: [
            { text: "Cancel", style: "cancel", onPress: () => setAlert(null) },
            {
              text: "Keep Both",
              style: "default",
              onPress: () => proceedUpload(fileMeta, "keep_both"),
            },
          ],
        });
      } else {
        setCheckingFile(false);
        // Show confirmation alert for new file
        setAlert({
          title: "Confirm Upload",
          message: (
            <>
              Do you want to upload "
              <span style={{ color: "#ff4343ff", fontWeight: "bold" }}>
                {file.name}
              </span>
              " (Size: {formatBytes(file.size)})?
            </>
          ),
          buttons: [
            { text: "Cancel", style: "cancel", onPress: () => setAlert(null) },
            {
              text: "Upload",
              style: "default",
              onPress: () => proceedUpload(fileMeta, "new"),
            },
          ],
        });
      }
    } catch (error) {
      console.error("Error checking file existence:", error);
      setCheckingFile(false);
      // Fallback to normal upload flow if check fails
      proceedUpload(fileMeta, "new");
    }
  };

  const proceedUpload = async (fileMeta, mode = "new") => {
    let tempId;
    try {
      setUploading(true);
      setAlert(null);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        setUploading(false);
        setAlert({
          title: "Not signed in",
          message: "You must be signed in to upload files.",
          buttons: [{ text: "OK", style: "default" }],
        });
        return;
      }

      tempId = `tmp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      if (onUploadStart) {
        onUploadStart({ id: tempId, name: fileMeta.name });
      }

      abortControllerRef.current = new AbortController();

      let filename = fileMeta.name;
      // Include folder in path to allow same filename in different folders
      const folderPrefix = currentFolderId ? `f_${currentFolderId}` : "root";
      let filePath = `${user.id}/${folderPrefix}/${filename}`;

      // Handle renaming for "Keep Both"
      if (mode === "keep_both") {
        const nameParts = filename.split(".");
        const ext = nameParts.length > 1 ? nameParts.pop() : "";
        const baseName = nameParts.join(".");
        const timestamp = Math.floor(Date.now() / 1000);
        filename = `${baseName} (${timestamp})${ext ? "." + ext : ""}`;
        filePath = `${user.id}/${folderPrefix}/${filename}`;
      }

      // Upload to Supabase
      const { data: _data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, fileMeta.uri, {
          cacheControl: "3600",
          upsert: false,
        });

      if (abortControllerRef.current?.signal.aborted) {
        throw new Error("Upload cancelled");
      }

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

      // Insert file metadata into database
      const { data: fileRow, error: dbError } = await supabase
        .from("files")
        .insert([
          {
            name: filename,
            path: filePath,
            size: fileMeta.size,
            mime_type: fileMeta.mimeType,
            uploaded_by: user.id,
            uploaded_by_email: user.email,
            folder_id: currentFolderId,
          },
        ])
        .select()
        .single();

      if (dbError) {
        console.error("Database operation failed:", dbError);

        if (mode !== "replace") {
          try {
            await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
            console.log(
              "Cleaned up uploaded file from storage due to DB error"
            );
          } catch (cleanupErr) {
            console.warn("Cleanup failed:", cleanupErr);
          }
        }
        throw new Error("Failed to save file metadata: " + dbError.message);
      }

      setUploading(false);
      toast.show("Upload success", `${filename} uploaded.`);

      if (onUploaded) {
        onUploaded(fileRow, publicUrl, tempId);
      }
    } catch (err) {
      if (err.message === "Upload cancelled") {
        console.log("Upload was cancelled by user");
        setUploading(false);
        return;
      }

      setUploading(false);
      console.error("Upload failed:", err);

      let errorMessage = err.message || "An error occurred during upload.";
      if (errorMessage.includes("Bucket not found")) {
        errorMessage =
          "Storage bucket 'files' not found. Please contact admin.";
      }

      setAlert({
        title: "Upload failed",
        message: errorMessage,
        buttons: [{ text: "OK", style: "default" }],
      });

      if (onUploaded) {
        onUploaded(null, null, tempId, err);
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setUploading(false);

    toast.show("Upload Cancelled", "The file upload was cancelled.");
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

      <div className="upload-btn-container">
        {uploading ? (
          <button
            className="upload-btn cancel-btn"
            onClick={handleCancelUpload}
            style={{ backgroundColor: "#ef4444" }} // Red color for cancel
          >
            <span>Cancel Upload</span>
          </button>
        ) : (
          <button
            className="upload-btn"
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
          >
            <FaPlus />
            <span>Upload</span>
          </button>
        )}
      </div>

      {alert && (
        <CustomAlert
          visible={!!alert}
          title={alert.title}
          message={alert.message}
          buttons={alert.buttons}
          onRequestClose={() => setAlert(null)}
        />
      )}

      {checkingFile && (
        <div
          style={{
            position: "fixed",
            top: "300px",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100000,
          }}
        >
          <div
            style={{
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              padding: "32px 48px",
              textAlign: "center",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            <div
              className="spinner"
              style={{
                fontSize: "2.5rem",
                color: "#3b82f6",
                marginBottom: "16px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <FaSpinner />
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: "1.15rem",
                fontWeight: 600,
                color: "var(--text-color)",
              }}
            >
              Checking file...
            </h3>
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
              }}
            >
              Please wait a moment
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default FileUploader;
