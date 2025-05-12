import React, { useState, useEffect } from "react";
import {
  getUserFolders,
  FolderInfo,
} from "@/services/libraryFolderManagementApi";
import { getUserSources } from "@/services/libraryManagementApi";
import LibraryFolderCard from "@/components/Library/LibraryFolderCard";
import EmptyFolders from "@/components/Library/EmptyFolders";
import { Loader2, FolderPlus, FolderUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LibraryListedFolderCardsProps {
  onCreateFolder?: () => void;
  onFolderSelect: (folder: FolderInfo | null) => void;
  selectedFolder: FolderInfo | null;
  refreshTrigger?: number;
  documentsExist?: boolean;
  onUploadFolder: () => void;
  isUploadingFolder: boolean;
}

const LibraryListedFolderCards: React.FC<LibraryListedFolderCardsProps> = ({
  onCreateFolder,
  onFolderSelect,
  selectedFolder,
  refreshTrigger = 0,
  documentsExist = false,
  onUploadFolder,
  isUploadingFolder,
}) => {
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [folderSourceCounts, setFolderSourceCounts] = useState<
    Record<string, number>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);

  // Combine external and local refresh triggers
  const combinedRefreshTrigger = refreshTrigger + localRefreshTrigger;

  const handleFolderDelete = (folderPath: string) => {
    // Immediately update UI by removing the folder from local state
    setFolders(folders.filter((folder) => folder.folder_path !== folderPath));

    // If the deleted folder was selected, clear the selection
    if (selectedFolder?.folder_path === folderPath) {
      onFolderSelect(null);
    }

    // Trigger a refresh to ensure data is consistent
    setLocalRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    const loadFolders = async () => {
      setIsLoading(true);
      try {
        // Get all folders
        const userFolders = await getUserFolders();
        setFolders(userFolders);

        // Get source counts for each folder
        const counts: Record<string, number> = {};
        for (const folder of userFolders) {
          try {
            const sources = await getUserSources(folder.folder_path);
            counts[folder.folder_path] = sources.length;
          } catch (err) {
            console.error(
              `Failed to get sources for folder ${folder.folder_path}:`,
              err
            );
            counts[folder.folder_path] = 0;
          }
        }
        setFolderSourceCounts(counts);
        setError(null);
      } catch (err) {
        console.error("Failed to load folders:", err);
        setError("Failed to load folders. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadFolders();
  }, [combinedRefreshTrigger]);

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
        <span>Loading folders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-6">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-6 px-6">
        <h2 className="text-2xl font-medium text-gray-900">Folders</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={onUploadFolder}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            disabled={isUploadingFolder}
          >
            {isUploadingFolder ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <FolderUp className="h-4 w-4" />
            )}
            Upload Folder
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateFolder}
            className="flex items-center gap-2"
          >
            <FolderPlus className="h-4 w-4" />
            Create folder
          </Button>
        </div>
      </div>

      {folders.length === 0 ? (
        <EmptyFolders
          onCreateFolder={onCreateFolder}
          documentsExist={documentsExist}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-6">
          {folders.map((folder) => (
            <LibraryFolderCard
              key={folder.folder_path}
              folder={folder}
              sourceCount={folderSourceCounts[folder.folder_path]}
              onSelect={onFolderSelect}
              isSelected={selectedFolder?.folder_path === folder.folder_path}
              onDelete={handleFolderDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LibraryListedFolderCards;
