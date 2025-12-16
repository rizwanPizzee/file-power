import { supabase } from "./supabase";

/**
 * Get folder name by ID
 */
export async function getFolderName(folderId) {
  if (!folderId) return "root";
  try {
    const { data } = await supabase
      .from("folders")
      .select("name")
      .eq("id", folderId)
      .single();
    return data?.name || "Unknown Folder";
  } catch (e) {
    return "Unknown";
  }
}

/**
 * Create a new folder
 */
export async function createFolder({ name, parentFolderId = null, user }) {
  if (!name) throw new Error("Folder name is required");
  if (!user || !user.id) throw new Error("User required for folder creation");

  const folderName = name.trim();

  try {
    const { data, error } = await supabase
      .from("folders")
      .insert([
        {
          name: folderName,
          parent_folder_id: parentFolderId,
          created_by: user.id,
          created_by_email: user.email,
          original_name: folderName,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Folder creation failed:", error);
      throw new Error(
        "Folder creation failed: " + (error.message || JSON.stringify(error))
      );
    }

    // Log the action
    try {
      const parentName = await getFolderName(parentFolderId);
      await supabase.from("user_file_logs").insert({
        user_id: user.id,
        user_email: user.email,
        action: "CREATE_FOLDER",
        file_name: folderName,
        file_path: parentName,
      });
    } catch (logErr) {
      console.warn("Failed to log folder creation:", logErr);
    }

    return data;
  } catch (err) {
    console.error("createFolder error:", err);
    throw err;
  }
}

/**
 * List folders in a specific parent folder with file/folder counts
 */
export async function listFolders({ parentFolderId = null } = {}) {
  try {
    let query = supabase
      .from("folders")
      .select("*, files(count), folders:folders!parent_folder_id(count)")
      .order("created_at", { ascending: false });

    if (parentFolderId === null) {
      query = query.is("parent_folder_id", null);
    } else {
      query = query.eq("parent_folder_id", parentFolderId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("listFolders error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("listFolders failed:", err);
    return [];
  }
}

/**
 * Get a folder by ID
 */
export async function getFolder(folderId) {
  if (!folderId) return null;

  try {
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("id", folderId)
      .single();

    if (error) {
      console.warn("getFolder error:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("getFolder failed:", err);
    return null;
  }
}

/**
 * Rename a folder
 */
export async function renameFolder({ folder, newName, user }) {
  if (!folder || !folder.id) throw new Error("Invalid folder object");
  if (!newName || !newName.trim()) throw new Error("New name is required");
  if (!user || !user.id) throw new Error("User required for rename");

  const oldFolderName = folder.name;
  const newFolderName = newName.trim();

  try {
    const { data, error } = await supabase
      .from("folders")
      .update({
        name: newFolderName,
        last_renamed_by: user.email || "Unknown",
        last_renamed_at: new Date().toISOString(),
      })
      .eq("id", folder.id)
      .select();

    if (error) {
      console.error("Folder rename failed:", error);
      throw new Error(
        "Folder rename failed: " + (error.message || JSON.stringify(error))
      );
    }

    if (!data || data.length === 0) {
      throw new Error(
        "Folder rename failed: No rows updated. Please check Supabase RLS UPDATE policy on folders table."
      );
    }

    // Log action
    try {
      const parentName = await getFolderName(folder.parent_folder_id);
      await supabase.from("user_file_logs").insert({
        user_id: user.id,
        user_email: user.email,
        action: "RENAME_FOLDER",
        file_name: newFolderName,
        file_path: parentName,
        old_file_name: oldFolderName,
        new_file_name: newFolderName,
      });
    } catch (logErr) {
      console.warn("Failed to log folder rename action:", logErr);
    }

    return data[0];
  } catch (err) {
    console.error("renameFolder error:", err);
    throw err;
  }
}

/**
 * Delete a folder and its contents
 */
export async function deleteFolder({ folder, user }) {
  if (!folder || !folder.id) throw new Error("Invalid folder object");
  if (!user || !user.id) throw new Error("User required for delete");

  try {
    // Delete files in folder first
    const { error: filesError } = await supabase
      .from("files")
      .delete()
      .eq("folder_id", folder.id);

    if (filesError) {
      console.warn("Error deleting files in folder:", filesError);
    }

    // Delete the folder
    const { error: deleteError } = await supabase
      .from("folders")
      .delete()
      .eq("id", folder.id);

    if (deleteError) {
      console.error("Folder delete failed:", deleteError);
      throw new Error(
        "Folder delete failed: " +
          (deleteError.message || JSON.stringify(deleteError))
      );
    }

    // Verify deletion
    const { data: checkData } = await supabase
      .from("folders")
      .select("id")
      .eq("id", folder.id)
      .single();

    if (checkData) {
      throw new Error(
        "Folder delete failed: folder still exists. Please check Supabase RLS delete policy on folders table."
      );
    }

    // Log action
    try {
      const parentName = await getFolderName(folder.parent_folder_id);
      await supabase.from("user_file_logs").insert({
        user_id: user.id,
        user_email: user.email,
        action: "DELETE_FOLDER",
        file_name: folder.name,
        file_path: parentName,
      });
    } catch (logErr) {
      console.warn("Failed to log folder delete action:", logErr);
    }

    return true;
  } catch (err) {
    console.error("deleteFolder error:", err);
    throw err;
  }
}

/**
 * Move a file to a different folder
 */
export async function moveFile({ file, destinationFolderId, user }) {
  if (!file || !file.id) throw new Error("Invalid file object");
  if (!user || !user.id) throw new Error("User required for move");

  const sourceFolderId = file.folder_id || null;

  try {
    const { data, error } = await supabase
      .from("files")
      .update({
        folder_id: destinationFolderId,
        last_moved_by: user.email,
        last_moved_at: new Date().toISOString(),
      })
      .eq("id", file.id)
      .select()
      .single();

    if (error) {
      console.error("Move file failed:", error);
      throw new Error(
        "Move failed: " + (error.message || JSON.stringify(error))
      );
    }

    // Log action
    try {
      const sourceName = await getFolderName(sourceFolderId);
      const destName = await getFolderName(destinationFolderId);

      await supabase.from("user_file_logs").insert({
        user_id: user.id,
        user_email: user.email,
        action: "MOVE",
        file_name: file.name,
        file_path: file.path,
        old_file_name: sourceName,
        new_file_name: destName,
      });
    } catch (logErr) {
      console.warn("Failed to log move action:", logErr);
    }

    return data;
  } catch (err) {
    console.error("moveFile error:", err);
    throw err;
  }
}
