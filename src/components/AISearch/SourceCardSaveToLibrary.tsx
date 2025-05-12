import { useState, useEffect } from "react";
import { Folder, Plus, Search, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StoredSource, addUserSource } from "@/services/libraryManagementApi";
import {
  FolderInfo,
  getUserFolders,
  createUserFolder,
} from "@/services/libraryFolderManagementApi";

interface SourceCardSaveToLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  sourceData: Partial<StoredSource>;
  onSuccess: () => void;
}

export default function SourceCardSaveToLibrary({
  isOpen,
  onClose,
  sourceData,
  onSuccess,
}: SourceCardSaveToLibraryProps) {
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>("/");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Load folders when the component mounts or dialog opens
  useEffect(() => {
    if (isOpen) {
      loadFolders();
    }
  }, [isOpen]);

  const loadFolders = async () => {
    setIsLoading(true);
    try {
      const userFolders = await getUserFolders();
      setFolders(userFolders);

      // If no folders exist, show the new folder dialog
      if (userFolders.length === 0) {
        setShowNewFolderDialog(true);
      }
    } catch (error) {
      console.error("Failed to load folders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToFolder = async () => {
    setIsSaving(true);
    try {
      // Add the selected folder path to the source data
      const sourceWithPath: Partial<StoredSource> = {
        ...sourceData,
        path: selectedFolder,
      };

      // Save the source to the library
      await addUserSource(sourceWithPath);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save source to library:", error);

      // Check if the error is a 409 conflict (already exists)
      // This checks both for error message containing '409' and specific text about DOI
      if (
        error instanceof Error &&
        (error.message.includes("409") ||
          error.message.includes("already exists") ||
          error.message.includes("Conflict"))
      ) {
        // If it's a 409 error, just close the modal as if it was successful
        console.log("Source already exists in library, closing modal");
        onSuccess();
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      // Create a new folder
      const folderPath = `/${newFolderName.trim()}/`;
      await createUserFolder({
        folder_path: folderPath,
        display_name: newFolderName.trim(),
      });

      // Reload folders and select the new one
      await loadFolders();
      setSelectedFolder(folderPath);
      setShowNewFolderDialog(false);
    } catch (error) {
      console.error("Failed to create folder:", error);
    } finally {
      setIsCreatingFolder(false);
      setNewFolderName("");
    }
  };

  // Filter folders based on search query
  const filteredFolders = folders.filter(
    (folder) =>
      folder.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      folder.folder_path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if root folder is in filtered results or if search is empty
  const showRootFolder =
    searchQuery === "" ||
    filteredFolders.some((folder) => folder.folder_path === "/") ||
    "/".includes(searchQuery.toLowerCase());

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to your library</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search folders..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* New folder button */}
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => setShowNewFolderDialog(true)}
          >
            <Plus className="h-4 w-4" />
            New folder
          </Button>

          {/* Folder list */}
          <div className="max-h-60 overflow-y-auto space-y-2 mt-4">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredFolders.length === 0 && !showRootFolder ? (
              <div className="text-center py-4 text-gray-500">
                {searchQuery ? "No matching folders found" : "No folders found"}
              </div>
            ) : (
              <>
                {/* Always show General Pool first if it matches search */}
                {showRootFolder && (
                  <div
                    className={`flex items-center p-3 rounded-lg cursor-pointer ${
                      selectedFolder === "/"
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                    onClick={() => setSelectedFolder("/")}
                  >
                    <div className="flex items-center flex-1 gap-3">
                      <Folder className="h-5 w-5 text-blue-500" />
                      <div className="flex-1 truncate">
                        <p className="font-medium">General Pool</p>
                      </div>
                    </div>
                    {selectedFolder === "/" && (
                      <Check className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                )}

                {/* Other folders */}
                {filteredFolders
                  .filter((folder) => folder.folder_path !== "/")
                  .map((folder) => (
                    <div
                      key={folder.folder_path}
                      className={`flex items-center p-3 rounded-lg cursor-pointer ${
                        selectedFolder === folder.folder_path
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                      onClick={() => setSelectedFolder(folder.folder_path)}
                    >
                      <div className="flex items-center flex-1 gap-3">
                        <Folder className="h-5 w-5 text-blue-500" />
                        <div className="flex-1 truncate">
                          <p className="font-medium">
                            {folder.display_name ||
                              folder.folder_path.replace(/\//g, "")}
                          </p>
                        </div>
                      </div>
                      {selectedFolder === folder.folder_path && (
                        <Check className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  ))}
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveToFolder}
              disabled={isSaving || isLoading}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* New folder dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a new Library folder</DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-sm">Name your new library folder</p>
              <Input
                type="text"
                placeholder="New folder..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewFolderDialog(false);
                  setNewFolderName("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFolder}
                disabled={isCreatingFolder || !newFolderName.trim()}
              >
                {isCreatingFolder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Confirm"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
