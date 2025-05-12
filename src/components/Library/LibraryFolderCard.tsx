import { Folder, Trash2 } from "lucide-react";
import {
  FolderInfo,
  deleteUserFolder,
} from "@/services/libraryFolderManagementApi";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LibraryFolderCardProps {
  folder: FolderInfo;
  sourceCount?: number;
  onSelect: (folder: FolderInfo) => void;
  isSelected?: boolean;
  onDelete?: (folderPath: string) => void;
}

export default function LibraryFolderCard({
  folder,
  sourceCount,
  onSelect,
  isSelected = false,
  onDelete,
}: LibraryFolderCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    onSelect(folder);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent folder selection when clicking delete
    try {
      setIsDeleting(true);
      setError(null);
      await deleteUserFolder(folder.folder_path);
      setDialogOpen(false);

      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete(folder.folder_path);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete folder");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection when clicking delete
    setDialogOpen(true);
  };

  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent folder selection when interacting with dialog
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent folder selection when clicking cancel
    setDialogOpen(false);
  };

  const canDelete = sourceCount === 0;

  return (
    <div
      className={`bg-white rounded-lg border ${
        isSelected ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200"
      } p-4 hover:border-blue-500 transition-colors cursor-pointer relative group`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2 mb-1">
        <Folder className="h-5 w-5 text-blue-500 flex-shrink-0" />
        <h3 className="text-base font-semibold text-gray-900 truncate">
          {folder.display_name || folder.folder_path.replace(/\//g, "")}
        </h3>

        {canDelete && (
          <div
            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDeleteClick}
          >
            <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
          </div>
        )}
      </div>

      {sourceCount !== undefined && (
        <p className="text-gray-500 text-xs ml-7">
          {sourceCount} {sourceCount === 1 ? "saved source" : "saved sources"}
        </p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClick={handleDialogClick}>
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              {canDelete
                ? `Are you sure you want to delete the folder "${
                    folder.display_name || folder.folder_path.replace(/\//g, "")
                  }"?`
                : `Cannot delete folder. You must move or delete all sources (${sourceCount}) from this folder before deleting it.`}
            </DialogDescription>
          </DialogHeader>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelClick}>
              Cancel
            </Button>
            {canDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
