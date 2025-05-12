import React, { useState, useEffect, useCallback } from "react";
import LibraryListedSourceCards from "@/components/Library/LibraryListedSourceCards";
import LibraryListedFolderCards from "@/components/Library/LibraryListedFolderCards";
import LibrarySearch from "@/components/Library/LibrarySearch";
import {
  getUserSources,
  deleteUserSource,
  moveUserSource,
  StoredSource,
  getUploadUrl,
  uploadFileToS3,
  registerUpload,
} from "@/services/libraryManagementApi";
import {
  createUserFolder,
  getUserFolders,
  FolderInfo,
} from "@/services/libraryFolderManagementApi";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Home,
  FileUp,
  UploadCloud,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

// Moved helper function to the top level to avoid linter errors
const truncateFileName = (fileName: string, maxLength: number = 30) => {
  if (fileName.length <= maxLength) return fileName;

  const extension = fileName.split(".").pop() || "";
  const nameWithoutExt = fileName.substring(
    0,
    fileName.length - extension.length - 1
  );

  const truncatedLength = maxLength - 3 - extension.length - 1;
  return `${nameWithoutExt.substring(0, truncatedLength)}...${
    extension ? "." + extension : ""
  }`;
};

interface UploadTask {
  id: string;
  file: File;
  title: string;
  status: "pending" | "uploading" | "processing" | "completed" | "error";
  errorMessage?: string;
  toastId?: React.ReactText;
  newSource?: StoredSource;
}

const Library: React.FC = () => {
  const [documents, setDocuments] = useState<StoredSource[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<StoredSource[]>(
    []
  );
  const [displayedDocuments, setDisplayedDocuments] = useState<StoredSource[]>(
    []
  );
  const [selectedFolder, setSelectedFolder] = useState<FolderInfo | null>(null);
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [folderRefreshTrigger, setFolderRefreshTrigger] = useState(0);
  const [, setUploadTasks] = useState<UploadTask[]>([]);
  const [isUploadingFolder, setIsUploadingFolder] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: null, message: "" });
    }, 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const sources = await getUserSources();
        setDocuments(sources);
        setFilteredDocuments(sources);
        setDisplayedDocuments(
          sources.filter((source) => !source.path || source.path === "/")
        );

        const userFolders = await getUserFolders();
        setFolders(userFolders);

        setError(null);
      } catch (err) {
        console.error("Failed to fetch library data:", err);
        setError("Failed to load your library. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (isSearchActive) {
      setDisplayedDocuments(filteredDocuments);
    } else if (selectedFolder) {
      setDisplayedDocuments(
        documents.filter((doc) => doc.path === selectedFolder.folder_path)
      );
    } else {
      setDisplayedDocuments(
        documents.filter((doc) => !doc.path || doc.path === "/")
      );
    }
  }, [selectedFolder, documents, filteredDocuments, isSearchActive]);

  const handleSearchResults = (results: StoredSource[]) => {
    setFilteredDocuments(results);
    setDisplayedDocuments(results);
    setIsSearchActive(results.length !== documents.length);
  };

  const handleFolderSelect = (folder: FolderInfo | null) => {
    setSelectedFolder(folder);
    setIsSearchActive(false);
  };

  const handleRemove = async (sourceId: string) => {
    try {
      await deleteUserSource(sourceId);

      const updatedDocuments = documents.filter(
        (doc) => doc.source_id !== sourceId
      );
      setDocuments(updatedDocuments);

      if (isSearchActive) {
        const updatedFiltered = filteredDocuments.filter(
          (doc) => doc.source_id !== sourceId
        );
        setFilteredDocuments(updatedFiltered);
        setDisplayedDocuments(updatedFiltered);
      } else {
        if (selectedFolder) {
          setDisplayedDocuments(
            updatedDocuments.filter(
              (doc) => doc.path === selectedFolder.folder_path
            )
          );
        } else {
          setDisplayedDocuments(
            updatedDocuments.filter((doc) => !doc.path || doc.path === "/")
          );
        }
      }

      showNotification("success", "Source removed successfully");
    } catch (err) {
      console.error("Failed to remove source:", err);
      showNotification("error", "Failed to remove source. Please try again.");
    }
  };

  const handleMoveSource = async (sourceId: string, newPath: string) => {
    try {
      await moveUserSource(sourceId, newPath);

      const updatedDocuments = documents.map((doc) =>
        doc.source_id === sourceId ? { ...doc, path: newPath } : doc
      );

      setDocuments(updatedDocuments);

      if (isSearchActive) {
        const updatedFiltered = filteredDocuments.map((doc) =>
          doc.source_id === sourceId ? { ...doc, path: newPath } : doc
        );
        setFilteredDocuments(updatedFiltered);
        setDisplayedDocuments(updatedFiltered);
      } else {
        if (selectedFolder) {
          setDisplayedDocuments(
            updatedDocuments.filter(
              (doc) => doc.path === selectedFolder.folder_path
            )
          );
        } else {
          setDisplayedDocuments(
            updatedDocuments.filter((doc) => !doc.path || doc.path === "/")
          );
        }
      }

      showNotification("success", "Source moved successfully");
    } catch (err) {
      console.error("Failed to move source:", err);
      showNotification("error", "Failed to move source. Please try again.");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      const folderPath = `/${newFolderName.trim()}/`;

      const newFolder = await createUserFolder({
        folder_path: folderPath,
        display_name: newFolderName.trim(),
      });

      setFolders([...folders, newFolder]);

      setShowCreateFolderDialog(false);
      setNewFolderName("");

      toast.success("Folder created successfully");

      setFolderRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to create folder:", err);
      let errorMessage = "Failed to create folder";
      let isExistingFolderError = false;

      if (err instanceof Error) {
        if (err.message.includes("already exists")) {
          errorMessage = "A folder with this name already exists";
          isExistingFolderError = true;
        }
      }

      if (isExistingFolderError) {
        toast.warning(errorMessage, { duration: 5000 });
      } else {
        toast.error(errorMessage, { duration: 5000 });
      }
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const getSourceListTitle = () => {
    if (isSearchActive) {
      return "Search results";
    } else if (selectedFolder) {
      return (
        selectedFolder.display_name ||
        selectedFolder.folder_path.replace(/\//g, "")
      );
    } else {
      return "General pool of sources";
    }
  };

  const updateUploadTask = (taskId: string, updates: Partial<UploadTask>) => {
    setUploadTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  };

  const processFilesForUpload = useCallback(
    (files: FileList | null, targetPathOverride?: string) => {
      if (!files || files.length === 0) return;

      const allowedFiles = Array.from(files);
      const newTasks: UploadTask[] = [];
      const targetPath =
        targetPathOverride ?? (selectedFolder?.folder_path || "/");

      allowedFiles.forEach((file) => {
        if (file.type === "application/pdf") {
          const taskId = uuidv4();
          const title = file.name.replace(/\.[^/.]+$/, "");
          newTasks.push({
            id: taskId,
            file: file,
            title: title,
            status: "pending",
          });
        } else if (file.size > 0) {
          toast.error("Invalid file type", {
            description: `${truncateFileName(
              file.name,
              30
            )} is not a PDF and was ignored.`,
            duration: 5000,
          });
        }
      });

      if (newTasks.length > 0) {
        setUploadTasks((prevTasks) => [...prevTasks, ...newTasks]);
        newTasks.forEach((task) => processSingleUpload(task, targetPath));
      }
    },
    [selectedFolder]
  );

  const processSingleUpload = async (task: UploadTask, targetPath?: string) => {
    const { id, file, title } = task;
    const finalTargetPath = targetPath ?? (selectedFolder?.folder_path || "/");

    updateUploadTask(id, { status: "uploading" });
    const toastId = toast.loading(
      `Uploading ${truncateFileName(file.name, 25)}...`,
      { duration: Infinity }
    );
    updateUploadTask(id, { toastId });

    try {
      const presignedData = await getUploadUrl(
        file.name,
        file.type || "application/pdf",
        title
      );

      const uploadSuccess = await uploadFileToS3(file, presignedData);
      if (!uploadSuccess) {
        throw new Error("Failed to upload file to S3");
      }

      updateUploadTask(id, { status: "processing" });
      toast.loading(`Processing ${truncateFileName(file.name, 25)}...`, {
        id: toastId,
        duration: Infinity,
      });

      const newSource = await registerUpload(
        presignedData.key,
        title,
        finalTargetPath
      );

      setDocuments((prevDocs) => [...prevDocs, newSource]);

      if (!isSearchActive) {
        if (finalTargetPath === (selectedFolder?.folder_path || "/")) {
          setDisplayedDocuments((prev) => [...prev, newSource]);
        }
      } else {
        setFilteredDocuments((prev) => [...prev, newSource]);
        setDisplayedDocuments((prev) => [...prev, newSource]);
      }

      updateUploadTask(id, { status: "completed", newSource });
      toast.success(
        `Successfully uploaded ${truncateFileName(file.name, 25)}. `,
        { id: toastId, duration: 5000 }
      );
    } catch (err) {
      console.error(`Upload failed for ${file.name}:`, err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      updateUploadTask(id, { status: "error", errorMessage });
      if (errorMessage === "Source already exists in this location.") {
        toast.warning(
          `Source "${truncateFileName(title, 25)}" already exists`,
          {
            id: toastId,
            duration: 5000,
          }
        );
      } else {
        toast.error(`Upload failed for ${truncateFileName(file.name, 25)}`, {
          id: toastId,
          duration: 10000,
          description:
            errorMessage.length > 50
              ? errorMessage.substring(0, 50) + "..."
              : errorMessage,
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFilesForUpload(e.target.files);
    e.target.value = "";
  };

  const triggerFileInput = () => {
    document.getElementById("pdf-file-hidden")?.click();
  };

  const triggerFolderInput = () => {
    document.getElementById("pdf-folder-hidden")?.click();
  };

  const handleFolderInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const pdfFiles = files.filter((file) => file.type === "application/pdf");

    if (pdfFiles.length === 0) {
      toast.error("No PDF files found in the selected folder.");
      e.target.value = "";
      return;
    }

    let folderName = "Uploaded Folder";
    if (pdfFiles[0]?.webkitRelativePath) {
      const pathParts = pdfFiles[0].webkitRelativePath.split("/");
      if (pathParts.length > 1) {
        folderName = pathParts[0];
      }
    }

    setIsUploadingFolder(true);
    const folderCreationToastId = toast.loading(
      `Creating folder "${folderName}"...`
    );

    let newFolder: FolderInfo | null = null;
    try {
      const folderPath = `/${folderName
        .trim()
        .replace(/[/\\?%*:|"<>]/g, "-")}/`;
      newFolder = await createUserFolder({
        folder_path: folderPath,
        display_name: folderName.trim(),
      });
      setFolders((prev) => [...prev, newFolder!]);
      setFolderRefreshTrigger((prev) => prev + 1);
      toast.success(`Folder "${folderName}" created successfully.`, {
        id: folderCreationToastId,
      });
    } catch (err) {
      console.error("Failed to create folder:", err);
      let errorMessage = `Failed to create folder "${folderName}"`;
      if (err instanceof Error && err.message.includes("already exists")) {
        errorMessage = `Folder "${folderName}" already exists. PDFs will be added if possible.`;
        newFolder =
          folders.find((f) => f.display_name === folderName.trim()) || null;
        if (!newFolder) {
          const generatedPath = `/${folderName
            .trim()
            .replace(/[/\\?%*:|"<>]/g, "-")}/`;
          newFolder =
            folders.find((f) => f.folder_path === generatedPath) || null;
        }
        if (!newFolder) {
          toast.error(errorMessage + " Could not find existing folder path.", {
            id: folderCreationToastId,
            duration: 5000,
          });
          setIsUploadingFolder(false);
          e.target.value = "";
          return;
        }
        toast.warning(errorMessage, {
          id: folderCreationToastId,
          duration: 5000,
        });
      } else {
        toast.error(errorMessage, {
          id: folderCreationToastId,
          duration: 5000,
        });
        setIsUploadingFolder(false);
        e.target.value = "";
        return;
      }
    }

    const newTasks: UploadTask[] = pdfFiles.map((file) => {
      const taskId = uuidv4();
      const title = file.name.replace(/\.[^/.]+$/, "");
      return {
        id: taskId,
        file: file,
        title: title,
        status: "pending",
      };
    });

    if (newTasks.length > 0) {
      setUploadTasks((prevTasks) => [...prevTasks, ...newTasks]);
      newTasks.forEach((task) =>
        processSingleUpload(task, newFolder!.folder_path)
      );
    }

    files.forEach((file) => {
      if (file.type !== "application/pdf" && file.size > 0) {
        toast.warning("Ignored non-PDF file", {
          description: `${truncateFileName(file.name, 30)} was ignored.`,
          duration: 5000,
        });
      }
    });

    setIsUploadingFolder(false);
    e.target.value = "";
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        processFilesForUpload(files);
        if (e.dataTransfer.items) {
          e.dataTransfer.items.clear();
        } else {
          e.dataTransfer.clearData();
        }
      }
    },
    [processFilesForUpload]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
        <span>Loading your library...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        <AlertCircle className="h-8 w-8 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen overflow-hidden relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-50 z-50 flex flex-col items-center justify-center border-4 border-dashed border-blue-700 rounded-lg pointer-events-none">
          <UploadCloud className="h-16 w-16 text-white mb-4" />
          <p className="text-white text-xl font-semibold">
            Drop PDF files here to upload to "{getSourceListTitle()}"
          </p>
        </div>
      )}

      {notification.type && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg ${
            notification.type === "success" ? "bg-green-50" : "bg-red-50"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500 mr-2" />
          )}
          <span
            className={
              notification.type === "success"
                ? "text-green-700"
                : "text-red-700"
            }
          >
            {notification.message}
          </span>
        </div>
      )}

      <input
        id="pdf-file-hidden"
        type="file"
        accept="application/pdf"
        multiple
        onChange={handleFileChange}
        className="hidden"
        style={{ display: "none" }}
      />

      <input
        id="pdf-folder-hidden"
        type="file"
        onChange={handleFolderInputChange}
        className="hidden"
        style={{ display: "none" }}
        // @ts-ignore
        webkitdirectory=""
        mozdirectory=""
        directory=""
        multiple
      />

      <div className="sticky top-0 bg-white z-10 pt-2">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="py-2">
            <LibrarySearch
              sources={documents}
              onSearchResults={handleSearchResults}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-8 px-4 max-w-6xl">
          <div className="space-y-8">
            {selectedFolder && (
              <div className="px-6 flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFolder(null)}
                  className="flex items-center gap-2 text-blue-600"
                >
                  <Home className="h-4 w-4" />
                  Back to all folders
                </Button>

                <Button
                  onClick={triggerFileInput}
                  className="flex items-center gap-2"
                  size="sm"
                  variant="outline"
                >
                  <FileUp className="h-4 w-4" />
                  Upload PDF
                </Button>
              </div>
            )}

            {!selectedFolder &&
              (documents.length > 0 || folders.length > 0) && (
                <div>
                  <LibraryListedFolderCards
                    onCreateFolder={() => setShowCreateFolderDialog(true)}
                    onFolderSelect={handleFolderSelect}
                    selectedFolder={selectedFolder}
                    refreshTrigger={folderRefreshTrigger}
                    documentsExist={documents.length > 0}
                    onUploadFolder={triggerFolderInput}
                    isUploadingFolder={isUploadingFolder}
                  />
                </div>
              )}

            <LibraryListedSourceCards
              sources={displayedDocuments}
              onRemoveSource={handleRemove}
              onMoveSource={handleMoveSource}
              folders={folders}
              currentPath={selectedFolder?.folder_path || "/"}
              title={getSourceListTitle()}
              onUploadPdf={triggerFileInput}
              showUploadButton={!selectedFolder && !isSearchActive}
            />
          </div>
        </div>
      </div>

      <Dialog
        open={showCreateFolderDialog}
        onOpenChange={setShowCreateFolderDialog}
      >
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
                  setShowCreateFolderDialog(false);
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

      <Toaster richColors closeButton position="bottom-right" />
    </div>
  );
};

export default Library;
