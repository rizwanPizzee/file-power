import React, {
  useEffect,
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { supabase } from "../lib/supabase";
import FileList from "./FileList";
import FileViewer from "./FileViewer";
import CustomAlert from "./CustomAlert";
import RenameModal from "./RenameModal";
import PropertiesModal from "./PropertiesModal";
import {
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaSync,
} from "react-icons/fa";
import { STORAGE_BUCKET } from "../lib/constants";
import "../App.css";

const FilesScreen = forwardRef((props, ref) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // desc or asc

  // Viewer state
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerFile, setViewerFile] = useState(null);
  const [viewerUrl, setViewerUrl] = useState(null);

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    buttons: [],
  });

  // Rename modal state
  const [renameVisible, setRenameVisible] = useState(false);
  const [fileToRename, setFileToRename] = useState(null);

  // Properties modal state
  const [propsVisible, setPropsVisible] = useState(false);
  const [propsFile, setPropsFile] = useState(null);
  const [propsUploader, setPropsUploader] = useState(null);
  const [propsLoading, setPropsLoading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .order("uploaded_at", { ascending: false })
        .limit(1000);

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error("Error fetching files:", error.message);
      let msg = error.message;
      if (msg.includes("relation") && msg.includes("does not exist")) {
        msg = "Table 'files' does not exist in Supabase.";
      }
      // We could show a toast or alert here if we wanted, but console is okay for fetch
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Expose handleUploaded to parent via ref
  useImperativeHandle(ref, () => ({
    handleUploaded: (fileRow, publicUrl, tempId, error) => {
      if (error) {
        // Error handled in uploader, but we can refresh if needed or log
      } else {
        fetchFiles();
        // Log upload
        (async () => {
          try {
            const { data: userData } = await supabase.auth.getUser();
            const user = userData?.user;

            await supabase.from("user_file_logs").insert([
              {
                user_id: user?.id,
                user_email: user?.email,
                action: "UPLOAD",
                file_name: fileRow.name,
                file_path: fileRow.path || fileRow.name,
              },
            ]);
          } catch (logErr) {
            console.warn("Failed to log upload action:", logErr);
          }
        })();
      }
    },
  }));

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFiles();
  };

  // Download state
  const [downloadingFileId, setDownloadingFileId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleDownload = async (file) => {
    if (downloadingFileId) return; // Prevent multiple downloads

    try {
      setDownloadingFileId(file.id);
      setDownloadProgress(0);

      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(file.path || file.name);

      if (data?.publicUrl) {
        // Use XMLHttpRequest to track progress
        const xhr = new XMLHttpRequest();
        xhr.open("GET", data.publicUrl, true);
        xhr.responseType = "blob";

        xhr.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setDownloadProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            const blob = xhr.response;
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
          } else {
            console.error("Download failed with status:", xhr.status);
            setAlertConfig({
              title: "Download Failed",
              message: "Could not download the file. Please try again.",
              buttons: [{ text: "OK" }],
            });
            setAlertVisible(true);
          }
          setDownloadingFileId(null);
          setDownloadProgress(0);
        };

        xhr.onerror = () => {
          console.error("Download network error");
          setAlertConfig({
            title: "Download Error",
            message: "Network error occurred during download.",
            buttons: [{ text: "OK" }],
          });
          setAlertVisible(true);
          setDownloadingFileId(null);
          setDownloadProgress(0);
        };

        xhr.send();
      } else {
        setDownloadingFileId(null);
      }
    } catch (error) {
      console.error("Error downloading file:", error.message);
      setAlertConfig({
        title: "Download Failed",
        message: "Could not download the file. Please try again.",
        buttons: [{ text: "OK" }],
      });
      setAlertVisible(true);
      setDownloadingFileId(null);
      setDownloadProgress(0);
    }
  };

  const handleDelete = (file) => {
    setAlertConfig({
      title: "Delete File",
      message: `Are you sure you want to delete "${file.name}"?`,
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Assuming 'files' bucket and file.name or file.path is the path
              const filePath = file.path || file.name;
              const { error: storageError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .remove([filePath]);

              if (storageError) throw storageError;

              const { error: dbError } = await supabase
                .from("files")
                .delete()
                .eq("id", file.id);

              if (dbError) throw dbError;

              // Log the deletion
              try {
                const { data: userData } = await supabase.auth.getUser();
                const user = userData?.user;

                await supabase.from("user_file_logs").insert([
                  {
                    user_id: user?.id,
                    user_email: user?.email,
                    action: "DELETE",
                    file_name: file.name,
                    file_path: file.path || file.name,
                  },
                ]);
              } catch (logErr) {
                console.warn("Failed to log delete action:", logErr);
              }

              fetchFiles();
            } catch (error) {
              console.error("Error deleting file:", error.message);
              setAlertConfig({
                title: "Error",
                message: error.message,
                buttons: [{ text: "OK" }],
              });
              setAlertVisible(true);
            }
          },
        },
      ],
    });
    setAlertVisible(true);
  };

  const handleView = (file) => {
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(file.path || file.name);
    if (data?.publicUrl) {
      setViewerFile(file);
      setViewerUrl(data.publicUrl);
      setViewerVisible(true);
    }
  };

  const handleRename = (file) => {
    setFileToRename(file);
    setRenameVisible(true);
  };

  const handleRenameSubmit = async (newName) => {
    if (!fileToRename) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      const { error } = await supabase
        .from("files")
        .update({
          name: newName,
          last_renamed_by: user?.email || "Unknown",
          last_renamed_at: new Date().toISOString(),
        })
        .eq("id", fileToRename.id);

      if (error) throw error;

      // Log the rename action
      try {
        await supabase.from("user_file_logs").insert({
          user_id: user?.id,
          user_email: user?.email,
          action: "RENAME",
          file_name: newName,
          file_path: fileToRename.path,
          old_file_name: fileToRename.name,
          new_file_name: newName,
        });
      } catch (logErr) {
        console.warn("Failed to log rename action:", logErr);
      }

      setRenameVisible(false);
      setFileToRename(null);
      fetchFiles();
    } catch (error) {
      console.error("Rename failed:", error);
      setAlertConfig({
        title: "Rename Failed",
        message: error.message || "Could not rename file",
        buttons: [{ text: "OK" }],
      });
      setAlertVisible(true);
    }
  };

  const handleProperties = async (file) => {
    setPropsFile(file);
    setPropsUploader(null);
    setPropsVisible(true);
    setPropsLoading(true);

    try {
      const [activeRes, deletedRes] = await Promise.all([
        supabase
          .from("safe_auth_users")
          .select("*")
          .eq("email", file.uploaded_by_email)
          .limit(1),
        supabase
          .from("deleted_auth_users")
          .select("*")
          .eq("email", file.uploaded_by_email)
          .limit(1),
      ]);

      if (deletedRes.error) throw deletedRes.error;
      if (activeRes.error) throw activeRes.error;

      const deleted = deletedRes.data?.[0] ?? null;
      const active = activeRes.data?.[0] ?? null;
      const u = deleted || active || null;

      if (u) {
        const meta = u.user_metadata || {};
        setPropsUploader({
          full_name: meta.full_name || u.full_name || null,
          email: u.email || null,
          age: meta.age || u.age || null,
          phone: meta.phone || u.phone || null,
          address: meta.address || u.address || null,
          bps: meta.bps || u.bps || null,
          grid_address: meta.grid_address || u.grid_address || null,
          department: u.department || meta.department || null,
          _deleted: !!deleted,
          deleted_at: deleted?.deleted_at ?? null,
          created_at: u.created_at ?? null,
        });
      } else {
        setPropsUploader(null);
      }
    } catch (error) {
      console.warn("Fetch uploader failed:", error);
      setPropsUploader(null);
    } finally {
      setPropsLoading(false);
    }
  };

  const handleShare = async (file) => {
    try {
      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(file.path || file.name);
      const publicUrl = data?.publicUrl || null;

      if (!publicUrl) {
        setAlertConfig({
          title: "Share Error",
          message: "Unable to get file URL for sharing.",
          buttons: [{ text: "OK" }],
        });
        setAlertVisible(true);
        return;
      }

      // Fetch uploader information
      let uploaderName = "Unknown User";
      try {
        const [activeRes, deletedRes] = await Promise.all([
          supabase
            .from("safe_auth_users")
            .select("*")
            .eq("email", file.uploaded_by_email)
            .limit(1),
          supabase
            .from("deleted_auth_users")
            .select("*")
            .eq("email", file.uploaded_by_email)
            .limit(1),
        ]);

        const deleted = deletedRes.data?.[0] ?? null;
        const active = activeRes.data?.[0] ?? null;
        const uploader = deleted || active || null;

        if (uploader) {
          const meta = uploader.user_metadata || {};
          uploaderName =
            meta.full_name ||
            uploader.full_name ||
            uploader.email ||
            "Unknown User";
        }
      } catch (e) {
        console.warn("Failed to fetch uploader info for share:", e);
      }

      const fileExt = file.name?.includes(".")
        ? file.name.split(".").pop().toUpperCase()
        : "FILE";

      const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
      };

      const shareMessage = `File Name: ${
        file.name
      }\n\nShared By: ${uploaderName}\n\nFile Details:\n  • Type: ${fileExt}\n  • Size: ${formatBytes(
        file.size
      )}\n\nFile Link: ${publicUrl}`;

      // Try Web Share API first
      if (navigator.share) {
        await navigator.share({
          title: `${file.name} - Shared by ${uploaderName}`,
          text: shareMessage,
          url: publicUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareMessage);
        setAlertConfig({
          title: "Copied to Clipboard",
          message: "File details and link copied to clipboard!",
          buttons: [{ text: "OK" }],
        });
        setAlertVisible(true);
      }
    } catch (error) {
      console.error("Share error:", error);
      if (error.name !== "AbortError") {
        setAlertConfig({
          title: "Share Error",
          message: error.message || "Failed to share file",
          buttons: [{ text: "OK" }],
        });
        setAlertVisible(true);
      }
    }
  };

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const filteredList = useMemo(() => {
    let list = [...files];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.uploaded_by_email && f.uploaded_by_email.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      const dateA = new Date(a.uploaded_at);
      const dateB = new Date(b.uploaded_at);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return list;
  }, [files, searchQuery, sortOrder]);

  return (
    <div className="files-screen">
      <div className="files-header">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="actions-bar">
          <button
            className="icon-button"
            onClick={toggleSort}
            title={`Sort by Date (${sortOrder})`}
          >
            {sortOrder === "desc" ? <FaSortAmountDown /> : <FaSortAmountUp />}
          </button>
          <button
            className="icon-button"
            onClick={fetchFiles}
            title="Refresh"
            disabled={loading}
          >
            <FaSync className={loading ? "spinner" : ""} />
          </button>
        </div>
      </div>

      <FileList
        data={filteredList}
        refreshing={loading || refreshing}
        onRefresh={handleRefresh}
        onDelete={handleDelete}
        onDownload={handleDownload}
        onView={handleView}
        onRename={handleRename}
        onProperties={handleProperties}
        onShare={handleShare}
        downloadingFileId={downloadingFileId}
        downloadProgress={downloadProgress}
      />

      <FileViewer
        visible={viewerVisible}
        file={viewerFile}
        url={viewerUrl}
        onClose={() => setViewerVisible(false)}
      />

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onRequestClose={() => setAlertVisible(false)}
      />

      <RenameModal
        visible={renameVisible}
        file={fileToRename}
        onClose={() => {
          setRenameVisible(false);
          setFileToRename(null);
        }}
        onSave={handleRenameSubmit}
      />

      <PropertiesModal
        visible={propsVisible}
        file={propsFile}
        uploader={propsUploader}
        loading={propsLoading}
        onClose={() => {
          setPropsVisible(false);
          setPropsFile(null);
          setPropsUploader(null);
        }}
      />
    </div>
  );
});

export default FilesScreen;
