import React, { useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useToast } from "./Toast";
import CustomAlert from "./CustomAlert";
import { FaCloudUploadAlt, FaSpinner, FaPlus } from "react-icons/fa";
import { STORAGE_BUCKET } from "../lib/constants";

const FileUploader = ({ onUploaded, onUploadStart }) => {
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState(null);
  const fileInputRef = useRef(null);
  const toast = useToast();
  const abortControllerRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset input so same file can be selected again if needed
    event.target.value = "";

    const fileMeta = {
      name: file.name,
      size: file.size,
      mimeType: file.type,
      uri: file, // In web, the file object itself is used
    };

    // Show confirmation alert
    setAlert({
      title: "Confirm Upload",
      message: `Do you want to upload "${file.name}" (${formatBytes(
        file.size
      )})?`,
      buttons: [
        { text: "Cancel", style: "cancel", onPress: () => setAlert(null) },
        {
          text: "Upload",
          style: "default",
          onPress: () => proceedUpload(fileMeta),
        },
      ],
    });
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const proceedUpload = async (fileMeta) => {
    let tempId;
    try {
      setUploading(true);
      setAlert(null); // Close confirmation alert

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

      // Notify parent about upload start
      if (onUploadStart) {
        onUploadStart({ id: tempId, name: fileMeta.name });
      }

      // Create AbortController for cancellation
      abortControllerRef.current = new AbortController();

      // Upload to Supabase
      const filename = fileMeta.name;
      const filePath = `${user.id}/${filename}`;

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

      // Get public URL (optional, depending on bucket privacy)
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
          },
        ])
        .select()
        .single();

      if (dbError) {
        console.error("Database insert failed:", dbError);
        // Try to remove the uploaded file from storage since DB insert failed
        try {
          await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
          console.log("Cleaned up uploaded file from storage due to DB error");
        } catch (cleanupErr) {
          console.warn("Cleanup failed:", cleanupErr);
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
    // Since we can't easily cancel the Supabase promise, we force state reset
    setUploading(false);
    // We might want to show a toast
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
    </>
  );
};

export default FileUploader;
