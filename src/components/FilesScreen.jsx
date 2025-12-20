import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { supabase } from "../lib/supabase";
import {
  createFolder,
  listFolders,
  moveFile,
  renameFolder,
  deleteFolder,
  getFolderName,
} from "../lib/storage";
import FileList from "./FileList";
import FileViewer from "./FileViewer";
import CustomAlert from "./CustomAlert";
import RenameModal from "./RenameModal";
import PropertiesModal from "./PropertiesModal";
import MoveToFolderModal from "./MoveToFolderModal";
import FolderPropertiesModal from "./FolderPropertiesModal";
import DeleteFolderModal from "./DeleteFolderModal";
import FolderRenameModal from "./FolderRenameModal";
import {
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaSync,
  FaFolderPlus,
  FaEyeSlash,
  FaArrowLeft,
  FaHome,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";
import { STORAGE_BUCKET } from "../lib/constants";
import "../App.css";

const FilesScreen = forwardRef((props, ref) => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [activeDuplicateFileId, setActiveDuplicateFileId] = useState(null);

  // Folder navigation state
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFolderName, setCurrentFolderName] = useState(null);
  const [folderPath, setFolderPath] = useState([]);

  // Create folder modal
  const [newFolderModalVisible, setNewFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderNameWarning, setFolderNameWarning] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Search scope
  const [searchScope, setSearchScope] = useState("Current");
  const [allSearchResults, setAllSearchResults] = useState([]);
  const [isSearchingAll, setIsSearchingAll] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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

  // Rename state
  const [renameVisible, setRenameVisible] = useState(false);
  const [fileToRename, setFileToRename] = useState(null);

  // Folder rename state
  const [folderRenameVisible, setFolderRenameVisible] = useState(false);
  const [folderToRename, setFolderToRename] = useState(null);

  // Folder delete state
  const [deleteFolderModalVisible, setDeleteFolderModalVisible] =
    useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);

  // Properties state
  const [propsVisible, setPropsVisible] = useState(false);
  const [propsFile, setPropsFile] = useState(null);
  const [propsUploader, setPropsUploader] = useState(null);
  const [propsLoading, setPropsLoading] = useState(false);

  // Folder properties state
  const [folderPropsVisible, setFolderPropsVisible] = useState(false);
  const [folderPropsData, setFolderPropsData] = useState(null);

  // Move modal state
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [fileToMove, setFileToMove] = useState(null);
  const [movingFile, setMovingFile] = useState(false);

  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  // Download state
  const [downloadingFileId, setDownloadingFileId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const fetchUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setCurrentUserEmail(data.user.email);
    }
  };

  const fetchFiles = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) {
        setFiles([]);
        setFolders([]);
        setLoading(true);
      }

      try {
        const [filesResult, foldersResult] = await Promise.all([
          (async () => {
            let query = supabase
              .from("files")
              .select("*")
              .order("uploaded_at", { ascending: false })
              .limit(1000);

            if (currentFolderId === null) {
              query = query.is("folder_id", null);
            } else {
              query = query.eq("folder_id", currentFolderId);
            }
            return query;
          })(),
          listFolders({ parentFolderId: currentFolderId }),
        ]);

        const { data: dbRows, error: dbErr } = filesResult;

        if (dbErr) {
          console.warn("fetchFiles db error:", dbErr);
        } else {
          setFiles((dbRows || []).map((r) => ({ ...r, source: "db" })));
        }

        setFolders(foldersResult);
      } catch (e) {
        console.warn("fetchFiles failed", e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentFolderId]
  );

  useEffect(() => {
    fetchFiles();
    fetchUser();
    setSearchScope("Current");
    setSearchQuery("");
  }, [fetchFiles]);

  useImperativeHandle(ref, () => ({
    handleUploaded: (fileRow, publicUrl, tempId, error, uploadFolderName) => {
      if (!error) {
        fetchFiles();
        (async () => {
          try {
            const { data: userData } = await supabase.auth.getUser();
            const user = userData?.user;
            // Use the folder name passed from upload, or current folder name, or resolve from folder_id
            let folderName = uploadFolderName || currentFolderName || "Root";
            await supabase.from("user_file_logs").insert([
              {
                user_id: user?.id,
                user_email: user?.email,
                action: "UPLOAD",
                file_name: fileRow.name,
                file_path: folderName,
              },
            ]);
          } catch (logErr) {
            console.warn("Failed to log upload action:", logErr);
          }
        })();
      }
    },
    currentFolderId,
    currentFolderName,
  }));

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFiles(true);
  };

  // Navigation functions
  const navigateToFolder = (folderId, folderName) => {
    setFiles([]);
    setFolders([]);
    setLoading(true);
    setSearchQuery("");
    setSearchScope("Current");

    if (folderId === null) {
      setCurrentFolderId(null);
      setCurrentFolderName(null);
      setFolderPath([]);
    } else {
      setFolderPath((prev) => [
        ...prev,
        { id: currentFolderId, name: currentFolderName },
      ]);
      setCurrentFolderId(folderId);
      setCurrentFolderName(folderName);
    }
  };

  const navigateBack = () => {
    if (folderPath.length === 0) return;

    setFiles([]);
    setFolders([]);
    setLoading(true);
    setSearchQuery("");

    const newPath = [...folderPath];
    const parent = newPath.pop();
    setFolderPath(newPath);
    setCurrentFolderId(parent?.id || null);
    setCurrentFolderName(parent?.name || null);
  };

  const navigateToRoot = () => {
    setFiles([]);
    setFolders([]);
    setLoading(true);
    setSearchQuery("");
    setCurrentFolderId(null);
    setCurrentFolderName(null);
    setFolderPath([]);
  };

  const navigateToBreadcrumb = (index) => {
    if (index < 0) {
      navigateToRoot();
      return;
    }

    setFiles([]);
    setFolders([]);
    setLoading(true);
    setSearchQuery("");

    const newPath = folderPath.slice(0, index + 1);
    const target = newPath.pop();
    setFolderPath(newPath);
    setCurrentFolderId(target?.id || null);
    setCurrentFolderName(target?.name || null);
  };

  // Create folder handlers
  const handleFolderNameChange = (text) => {
    setNewFolderName(text);
    if (!text.trim()) {
      setFolderNameWarning("");
      return;
    }

    const duplicate = folders.some(
      (f) => f.name.toLowerCase() === text.trim().toLowerCase()
    );

    if (duplicate) {
      setFolderNameWarning("A folder with this name already exists.");
    } else {
      setFolderNameWarning("");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    if (folderNameWarning) return;

    setCreatingFolder(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        setAlertConfig({
          title: "Error",
          message: "You must be signed in to create folders",
          buttons: [{ text: "OK" }],
        });
        setAlertVisible(true);
        return;
      }

      await createFolder({
        name: newFolderName.trim(),
        parentFolderId: currentFolderId,
        user: { id: user.id, email: user.email },
      });

      setNewFolderModalVisible(false);
      setNewFolderName("");
      setFolderNameWarning("");
      fetchFiles();
    } catch (err) {
      console.error("Create folder failed:", err);
      setAlertConfig({
        title: "Error",
        message: err.message || "Failed to create folder",
        buttons: [{ text: "OK" }],
      });
      setAlertVisible(true);
    } finally {
      setCreatingFolder(false);
    }
  };

  // Search scope handlers
  const performGlobalSearch = async (text) => {
    if (!text.trim()) {
      setAllSearchResults([]);
      return;
    }

    setIsSearchingAll(true);
    try {
      const matchPattern = `%${text}%`;

      const { data: fileData, error: fileErr } = await supabase
        .from("files")
        .select(`*, folders:folder_id ( name )`)
        .or(
          `name.ilike.${matchPattern},uploaded_by_email.ilike.${matchPattern}`
        );

      if (fileErr) throw fileErr;

      const { data: folderData, error: folderErr } = await supabase
        .from("folders")
        .select("*")
        .or(
          `name.ilike.${matchPattern},created_by_email.ilike.${matchPattern}`
        );

      if (folderErr) throw folderErr;

      const mappedFiles = (fileData || []).map((f) => ({
        ...f,
        source: "db",
        folderName: f.folders?.name || null,
        _isFolder: false,
      }));

      const mappedFolders = (folderData || []).map((f) => ({
        ...f,
        _isFolder: true,
        source: "db",
      }));

      setAllSearchResults([...mappedFolders, ...mappedFiles]);
    } catch (err) {
      console.error("Global search error:", err);
      setAllSearchResults([]);
    } finally {
      setIsSearchingAll(false);
    }
  };

  const toggleSearchScope = (scope) => {
    if (scope === searchScope) return;
    setSearchScope(scope);
    if (scope === "All" && searchQuery.trim()) {
      performGlobalSearch(searchQuery);
    }
  };

  useEffect(() => {
    if (searchScope === "All" && currentFolderId === null) {
      const timer = setTimeout(() => {
        if (searchQuery.trim()) {
          performGlobalSearch(searchQuery);
        } else {
          setAllSearchResults([]);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, searchScope, currentFolderId]);

  // Move file handlers
  const handleMoveFile = (file) => {
    setFileToMove(file);
    setMoveModalVisible(true);
  };

  const performMove = async (destinationFolderId) => {
    if (!fileToMove) return;

    setMovingFile(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        setAlertConfig({
          title: "Error",
          message: "You must be signed in to move files",
          buttons: [{ text: "OK" }],
        });
        setAlertVisible(true);
        return;
      }

      await moveFile({
        file: fileToMove,
        destinationFolderId,
        user: { id: user.id, email: user.email },
      });

      setMoveModalVisible(false);
      setFileToMove(null);
      fetchFiles();
    } catch (err) {
      console.error("Move failed:", err);
      setAlertConfig({
        title: "Move Failed",
        message: err.message || "Could not move file",
        buttons: [{ text: "OK" }],
      });
      setAlertVisible(true);
    } finally {
      setMovingFile(false);
    }
  };

  // Folder action handlers
  const handleFolderRename = (folder) => {
    setFolderToRename(folder);
    setFolderRenameVisible(true);
  };

  const performFolderRename = async (newName) => {
    if (!folderToRename || !newName) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        setAlertConfig({
          title: "Error",
          message: "You must be signed in to rename folders",
          buttons: [{ text: "OK" }],
        });
        setAlertVisible(true);
        return;
      }

      await renameFolder({
        folder: folderToRename,
        newName,
        user: { id: user.id, email: user.email },
      });

      setFolderRenameVisible(false);
      setFolderToRename(null);
      fetchFiles();
    } catch (err) {
      console.error("Folder rename failed:", err);
      // Re-throw to let the modal handle the error display
      throw err;
    }
  };

  const handleFolderDelete = (folder) => {
    setFolderToDelete(folder);
    setDeleteFolderModalVisible(true);
  };

  const executeFolderDelete = async () => {
    if (!folderToDelete) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        throw new Error("You must be signed in to delete folders");
      }

      await deleteFolder({
        folder: folderToDelete,
        user: { id: user.id, email: user.email },
      });

      setDeleteFolderModalVisible(false);
      setFolderToDelete(null);
      fetchFiles();

      // Show success modal/alert
      setAlertConfig({
        title: "Success",
        message: "Folder deleted successfully.",
        buttons: [{ text: "OK", style: "default" }],
      });
      setAlertVisible(true);
    } catch (err) {
      console.error("Folder delete failed:", err);
      // Re-throw to let the modal handle the error display
      throw err;
    }
  };

  const handleFolderProperties = (folder) => {
    setFolderPropsData(folder);
    setFolderPropsVisible(true);
  };

  // File action handlers
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownload = async (file) => {
    if (downloadingFileId) return;

    setAlertConfig({
      title: "Download Confirmation",
      message: `File Name: ${file.name}\n\nFile Size: ${formatBytes(
        file.size
      )}\n\nOnce your download starts, it cannot be cancelled until fully downloaded. Do you want to proceed?`,
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Download",
          style: "default",
          onPress: async () => {
            setAlertVisible(false);

            try {
              setDownloadingFileId(file.id);
              setDownloadProgress(0);

              const { data } = supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(file.path || file.name);

              if (data?.publicUrl) {
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
                  }
                  setDownloadingFileId(null);
                  setDownloadProgress(0);
                };

                xhr.onerror = () => {
                  setDownloadingFileId(null);
                  setDownloadProgress(0);
                };

                xhr.send();
              } else {
                setDownloadingFileId(null);
              }
            } catch (error) {
              console.error("Error downloading file:", error.message);
              setDownloadingFileId(null);
              setDownloadProgress(0);
            }
          },
        },
      ],
    });
    setAlertVisible(true);
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
          closeOnPress: false,
          onPress: async () => {
            setAlertConfig({
              title: "Deleting...",
              message: `Deleting "${file.name}". Please wait...`,
              buttons: [],
              showSpinner: true,
            });

            try {
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

              try {
                const { data: userData } = await supabase.auth.getUser();
                const user = userData?.user;

                // Get the folder name for logging - use file.folder_id if available, otherwise current folder
                let logFolderName = "Root";
                if (file.folder_id) {
                  logFolderName = await getFolderName(file.folder_id);
                } else if (currentFolderName) {
                  logFolderName = currentFolderName;
                }

                await supabase.from("user_file_logs").insert([
                  {
                    user_id: user?.id,
                    user_email: user?.email,
                    action: "DELETE",
                    file_name: file.name,
                    file_path: logFolderName,
                  },
                ]);
              } catch (logErr) {
                console.warn("Failed to log delete action:", logErr);
              }

              setAlertVisible(false);
              fetchFiles();
            } catch (error) {
              console.error("Error deleting file:", error.message);
              setAlertConfig({
                title: "Error",
                message: error.message,
                buttons: [{ text: "OK" }],
                showSpinner: false,
              });
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

      const shareMessage = `File: ${file.name}\nSize: ${formatBytes(
        file.size
      )}\nLink: ${publicUrl}`;

      if (navigator.share) {
        await navigator.share({
          title: file.name,
          text: shareMessage,
          url: publicUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareMessage);
        setAlertConfig({
          title: "Copied to Clipboard",
          message: "File details and link copied to clipboard!",
          buttons: [{ text: "OK" }],
        });
        setAlertVisible(true);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Share error:", error);
      }
    }
  };

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  // Combined list with folders and files
  const combinedList = useMemo(() => {
    if (searchScope === "All" && currentFolderId === null && searchQuery) {
      return allSearchResults;
    }

    const folderItems = folders.map((f) => ({
      ...f,
      _isFolder: true,
      name: f.name,
      uploaded_at: f.created_at,
    }));

    return [...folderItems, ...files];
  }, [
    folders,
    files,
    searchScope,
    allSearchResults,
    searchQuery,
    currentFolderId,
  ]);

  const filteredList = useMemo(() => {
    if (searchScope === "All" && currentFolderId === null && searchQuery) {
      let list = [...combinedList];
      list.sort((a, b) => {
        if (a._isFolder && !b._isFolder) return -1;
        if (!a._isFolder && b._isFolder) return 1;

        const dateA = new Date(a.uploaded_at || a.created_at || 0);
        const dateB = new Date(b.uploaded_at || b.created_at || 0);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
      return list;
    }

    const normalizedQuery = (searchQuery || "").trim().toLowerCase();

    let list = normalizedQuery
      ? combinedList.filter((item) => {
          const name = (item.name || "").toLowerCase();
          const email = (
            item.uploaded_by_email ||
            item.created_by_email ||
            ""
          ).toLowerCase();

          let dateStr = "";
          if (item.uploaded_at || item.created_at) {
            const d = new Date(item.uploaded_at || item.created_at);
            // Match standard format (e.g. 12/16/2024)
            const standard = d.toLocaleDateString().toLowerCase();
            // Match folder display format (e.g. Dec 16)
            const folderFormat = d
              .toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
              .toLowerCase();
            // Match full month name (e.g. December)
            const longMonth = d
              .toLocaleDateString(undefined, {
                month: "long",
              })
              .toLowerCase();

            dateStr = `${standard} ${folderFormat} ${longMonth}`;
          }

          return (
            name.includes(normalizedQuery) ||
            email.includes(normalizedQuery) ||
            dateStr.includes(normalizedQuery)
          );
        })
      : combinedList;

    list.sort((a, b) => {
      if (a._isFolder && !b._isFolder) return -1;
      if (!a._isFolder && b._isFolder) return 1;

      const dateA = new Date(a.uploaded_at || a.created_at || 0);
      const dateB = new Date(b.uploaded_at || b.created_at || 0);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return list;
  }, [combinedList, searchQuery, sortOrder, searchScope, currentFolderId]);

  const duplicatesMap = useMemo(() => {
    const getBaseName = (filename) => {
      // Remove (1), (2) etc. from the end of the filename
      return filename.replace(/\s*\(\d+\)(\.[^.]+)?$/, "$1");
    };

    const groups = {};

    filteredList.forEach((file) => {
      if (file._isFolder) return;
      const baseName = getBaseName(file.name);
      if (!groups[baseName]) {
        groups[baseName] = [];
      }
      groups[baseName].push(file);
    });

    const duplicates = {};
    Object.keys(groups).forEach((baseName) => {
      if (groups[baseName].length > 1) {
        const sortedGroup = [...groups[baseName]].sort(
          (a, b) => new Date(a.uploaded_at) - new Date(b.uploaded_at)
        );

        sortedGroup.forEach((file, index) => {
          duplicates[file.id] = {
            index: index + 1,
            total: sortedGroup.length,
            others: sortedGroup.filter((f) => f.id !== file.id),
          };
        });
      }
    });

    return duplicates;
  }, [filteredList]);

  return (
    <div className="files-screen">
      <div className="files-header">
        <div className="search-bar">
          <FaSearch className="search-icon-search" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery("")}>
              <FaTimes />
            </button>
          )}
        </div>

        <div className="actions-bar">
          <OverlayTrigger
            placement="bottom"
            delay={{ show: 400, hide: 100 }}
            overlay={<Tooltip id="tooltip-new-folder">New Folder</Tooltip>}
          >
            <button
              className="icon-button new-folder-button"
              onClick={() => setNewFolderModalVisible(true)}
            >
              <FaFolderPlus size={30} color="#fad920ff" />
            </button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="bottom"
            delay={{ show: 400, hide: 100 }}
            overlay={
              <Tooltip id="tooltip-sort">Sort by Date ({sortOrder})</Tooltip>
            }
          >
            <button className="icon-button sort-button" onClick={toggleSort}>
              {sortOrder === "desc" ? <FaSortAmountDown /> : <FaSortAmountUp />}
            </button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="bottom"
            delay={{ show: 400, hide: 100 }}
            overlay={<Tooltip id="tooltip-refresh">Refresh</Tooltip>}
          >
            <button
              className="icon-button"
              onClick={handleRefresh}
              disabled={loading}
            >
              <FaSync className={loading ? "spinner" : ""} />
            </button>
          </OverlayTrigger>
        </div>
      </div>

      {/* Search Scope Toggle - only at root */}
      {currentFolderId === null &&
        (searchQuery.length > 0 || isSearchFocused) && (
          <div
            className="scope-container"
            onMouseDown={(e) => e.preventDefault()}
          >
            <button
              className={`scope-btn ${
                searchScope === "Current" ? "active" : ""
              }`}
              onClick={() => toggleSearchScope("Current")}
            >
              Current
            </button>
            <button
              className={`scope-btn ${searchScope === "All" ? "active" : ""}`}
              onClick={() => toggleSearchScope("All")}
            >
              All
            </button>
          </div>
        )}

      {/* Breadcrumb Navigation */}
      {currentFolderId !== null && (
        <div className="breadcrumb-container">
          <button className="breadcrumb-back" onClick={navigateBack}>
            <FaArrowLeft />
          </button>
          <div className="breadcrumb-path">
            <button className="breadcrumb-item" onClick={navigateToRoot}>
              <FaHome />
              <span>Root</span>
            </button>
            {folderPath.map((item, index) => (
              <React.Fragment key={item.id || index}>
                <span className="breadcrumb-separator">/</span>
                <button
                  className="breadcrumb-item"
                  onClick={() => navigateToBreadcrumb(index)}
                >
                  {item.name || "..."}
                </button>
              </React.Fragment>
            ))}
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{currentFolderName}</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-container">
        <span className="stats-text">
          {folders.length} Folder{folders.length !== 1 ? "s" : ""},{" "}
          {files.length} File{files.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Clear Duplicate Detection */}
      {activeDuplicateFileId && (
        <div className="duplicate-clear-container">
          <OverlayTrigger
            placement="bottom"
            delay={{ show: 400, hide: 100 }}
            overlay={
              <Tooltip id="tooltip-clear-dup">
                Clear Duplicate Detection
              </Tooltip>
            }
          >
            <button
              className="icon-button1 active"
              onClick={() => setActiveDuplicateFileId(null)}
            >
              <FaEyeSlash />{" "}
              <span style={{ marginLeft: "10px" }}>
                Clear Duplicate Detection
              </span>
            </button>
          </OverlayTrigger>
        </div>
      )}

      <FileList
        data={filteredList}
        refreshing={loading || refreshing || isSearchingAll}
        onRefresh={handleRefresh}
        onDelete={handleDelete}
        onDownload={handleDownload}
        onView={handleView}
        onRename={handleRename}
        onProperties={handleProperties}
        onShare={handleShare}
        onMove={handleMoveFile}
        onFolderOpen={navigateToFolder}
        onFolderRename={handleFolderRename}
        onFolderDelete={handleFolderDelete}
        onFolderProperties={handleFolderProperties}
        downloadingFileId={downloadingFileId}
        downloadProgress={downloadProgress}
        currentUserEmail={currentUserEmail}
        currentFolderId={currentFolderId}
        duplicatesMap={duplicatesMap}
        activeDuplicateFileId={activeDuplicateFileId}
        onDuplicateTagClick={setActiveDuplicateFileId}
      />

      {/* File Viewer */}
      <FileViewer
        visible={viewerVisible}
        file={viewerFile}
        url={viewerUrl}
        onClose={() => setViewerVisible(false)}
      />

      {/* Alert Modal */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onRequestClose={() => setAlertVisible(false)}
        showSpinner={alertConfig.showSpinner}
      />

      {/* File Rename Modal */}
      <RenameModal
        visible={renameVisible}
        file={fileToRename}
        onClose={() => {
          setRenameVisible(false);
          setFileToRename(null);
        }}
        onSave={handleRenameSubmit}
      />

      {/* Folder Rename Modal */}
      <FolderRenameModal
        visible={folderRenameVisible}
        folder={folderToRename}
        existingNames={folders.map((f) => f.name)}
        onClose={() => {
          setFolderRenameVisible(false);
          setFolderToRename(null);
        }}
        onRename={performFolderRename}
      />

      {/* Delete Folder Modal */}
      <DeleteFolderModal
        visible={deleteFolderModalVisible}
        folder={folderToDelete}
        onClose={() => {
          setDeleteFolderModalVisible(false);
          setFolderToDelete(null);
        }}
        onDelete={executeFolderDelete}
      />

      {/* File Properties Modal */}
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

      {/* Folder Properties Modal */}
      <FolderPropertiesModal
        visible={folderPropsVisible}
        folder={folderPropsData}
        onClose={() => {
          setFolderPropsVisible(false);
          setFolderPropsData(null);
        }}
      />

      {/* Move to Folder Modal */}
      <MoveToFolderModal
        visible={moveModalVisible}
        file={fileToMove}
        currentFolderId={currentFolderId}
        onClose={() => {
          setMoveModalVisible(false);
          setFileToMove(null);
        }}
        onMove={performMove}
        moving={movingFile}
      />

      {/* Create Folder Modal */}
      {newFolderModalVisible && (
        <div
          className="modal-overlay"
          onClick={() => setNewFolderModalVisible(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Folder</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setNewFolderModalVisible(false);
                  setNewFolderName("");
                  setFolderNameWarning("");
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="modal-input"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => handleFolderNameChange(e.target.value)}
                autoFocus
              />
              {folderNameWarning && (
                <div className="warning-text">{folderNameWarning}</div>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="modal-btn cancel"
                onClick={() => {
                  setNewFolderModalVisible(false);
                  setNewFolderName("");
                  setFolderNameWarning("");
                }}
              >
                Cancel
              </button>
              <button
                className="modal-btn primary"
                onClick={handleCreateFolder}
                disabled={
                  creatingFolder || !newFolderName.trim() || !!folderNameWarning
                }
              >
                {creatingFolder ? <FaSpinner className="spinner" /> : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default FilesScreen;
