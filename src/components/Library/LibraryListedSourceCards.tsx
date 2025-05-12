import React, { useState, useEffect, useMemo } from "react";
import EmptyLibrary from "@/components/Library/EmptyLibrary";
import LibrarySourceCard from "@/components/Library/LibrarySourceCard";
import { StoredSource } from "@/services/libraryManagementApi";
import { FolderInfo } from "@/services/libraryFolderManagementApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileUp,
  Trash2,
  Folder,
  CheckSquare,
  Square,
  Check,
  ListChecks,
  ArrowUpDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Define Sort Configuration Type
type SortKey = "publication_date" | "created_at" | "journal" | "authors";
type SortOrder = "asc" | "desc";
interface SortConfig {
  key: SortKey;
  order: SortOrder;
}

interface LibraryListedSourceCardsProps {
  sources: StoredSource[];
  onRemoveSource: (id: string) => void;
  onMoveSource: (sourceId: string, newPath: string) => Promise<void>;
  folders: FolderInfo[];
  currentPath?: string;
  title?: string;
  onUploadPdf?: () => void;
  showUploadButton?: boolean;
}

const LibraryListedSourceCards: React.FC<LibraryListedSourceCardsProps> = ({
  sources,
  onRemoveSource,
  onMoveSource,
  folders,
  currentPath = "/",
  title = "General pool of sources",
  onUploadPdf,
  showUploadButton = false,
}) => {
  const [isManaging, setIsManaging] = useState(false);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [showBulkMoveDialog, setShowBulkMoveDialog] = useState(false);
  const [selectedBulkMoveFolderId, setSelectedBulkMoveFolderId] = useState<
    string | null
  >(null);
  const [isBulkMoving, setIsBulkMoving] = useState(false);

  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    const savedSortConfig = localStorage.getItem("librarySortConfig");
    return savedSortConfig
      ? JSON.parse(savedSortConfig)
      : { key: "created_at", order: "desc" };
  });

  useEffect(() => {
    localStorage.setItem("librarySortConfig", JSON.stringify(sortConfig));
  }, [sortConfig]);

  const sortedSources = useMemo(() => {
    const sortableSources = [...sources];
    sortableSources.sort((a, b) => {
      const orderMultiplier = sortConfig.order === "asc" ? 1 : -1;

      switch (sortConfig.key) {
        case "authors":
          const authorA = a.authors?.[0]?.toLowerCase() || "";
          const authorB = b.authors?.[0]?.toLowerCase() || "";
          return authorA.localeCompare(authorB) * orderMultiplier;

        case "publication_date":
        case "created_at":
          // Handle date sorting (treat invalid dates as earliest/latest depending on order)
          const defaultDateAsc = "0000-00-00"; // Far past for asc
          const defaultDateDesc = "9999-12-31"; // Far future for asc

          const dateStrA = a[sortConfig.key]; // Access using the specific key
          const dateStrB = b[sortConfig.key];

          const dateA = new Date(
            dateStrA ||
              (sortConfig.order === "asc" ? defaultDateDesc : defaultDateAsc)
          );
          const dateB = new Date(
            dateStrB ||
              (sortConfig.order === "asc" ? defaultDateDesc : defaultDateAsc)
          );

          // Check for invalid dates (NaN)
          const timeA = isNaN(dateA.getTime())
            ? sortConfig.order === "asc"
              ? Infinity
              : -Infinity
            : dateA.getTime();
          const timeB = isNaN(dateB.getTime())
            ? sortConfig.order === "asc"
              ? Infinity
              : -Infinity
            : dateB.getTime();

          return (timeA - timeB) * orderMultiplier;

        case "journal":
          const journalA = a.journal?.toLowerCase() || "";
          const journalB = b.journal?.toLowerCase() || "";
          return journalA.localeCompare(journalB) * orderMultiplier;

        default:
          return 0;
      }
    });
    return sortableSources;
  }, [sources, sortConfig]);

  const handleToggleManage = () => {
    setIsManaging(!isManaging);
    setSelectedSourceIds([]);
  };

  const handleSelectSource = (sourceId: string, select: boolean) => {
    setSelectedSourceIds((prev) =>
      select ? [...prev, sourceId] : prev.filter((id) => id !== sourceId)
    );
  };

  const handleSelectAll = () => {
    setSelectedSourceIds(sources.map((s) => s.source_id || ""));
  };

  const handleDeselectAll = () => {
    setSelectedSourceIds([]);
  };

  const handleDeleteSelected = async () => {
    if (selectedSourceIds.length === 0) return;
    console.log("Deleting sources:", selectedSourceIds);
    try {
      await Promise.all(selectedSourceIds.map((id) => onRemoveSource(id)));
      setSelectedSourceIds([]);
      setIsManaging(false);
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete selected sources:", error);
    }
  };

  const openBulkMoveDialog = () => {
    if (selectedSourceIds.length === 0) return;
    setSelectedBulkMoveFolderId(null);
    setShowBulkMoveDialog(true);
  };

  const handleConfirmBulkMove = async () => {
    if (selectedSourceIds.length === 0 || !selectedBulkMoveFolderId) return;
    console.log(
      `Moving sources: ${selectedSourceIds} to ${selectedBulkMoveFolderId}`
    );

    setIsBulkMoving(true);
    try {
      await Promise.all(
        selectedSourceIds.map((id) =>
          onMoveSource(id, selectedBulkMoveFolderId)
        )
      );
      setSelectedSourceIds([]);
      setIsManaging(false);
      setShowBulkMoveDialog(false);
      window.location.reload();
    } catch (error) {
      console.error("Failed to move selected sources:", error);
    } finally {
      setIsBulkMoving(false);
    }
  };

  const allSelected =
    selectedSourceIds.length === sources.length && sources.length > 0;

  if (sources.length === 0 && !isManaging) {
    return <EmptyLibrary onUpload={onUploadPdf} />;
  }

  const handleSortChange = (value: string) => {
    const [key, order] = value.split("-") as [SortKey, SortOrder];
    setSortConfig({ key, order });
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6 px-6 min-h-[40px]">
        {isManaging ? (
          <>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">
                Selected: {selectedSourceIds.length} out of {sources.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={allSelected ? handleDeselectAll : handleSelectAll}
                className="px-2"
              >
                {allSelected ? (
                  <CheckSquare className="h-4 w-4 mr-1" />
                ) : (
                  <Square className="h-4 w-4 mr-1" />
                )}
                {allSelected ? "Deselect All" : "Select All"}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openBulkMoveDialog}
                disabled={selectedSourceIds.length === 0}
                className="flex items-center gap-1"
              >
                <Folder className="h-4 w-4" /> Move
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={selectedSourceIds.length === 0}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleToggleManage}
                className="ml-2"
              >
                Done
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center">
              <h2 className="text-2xl font-medium text-gray-900">{title}</h2>
              {sources.length > 0 && (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium ml-2">
                  {sources.length}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {sources.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <ArrowUpDown className="h-4 w-4" />
                      <span className="sr-only">Sort Sources</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="px-2 pb-1.5 pt-2">
                      Sort by
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                      <RadioGroup
                        value={`${sortConfig.key}-${sortConfig.order}`}
                        onValueChange={handleSortChange}
                        className="flex flex-col space-y-3"
                      >
                        <div className="space-y-3 mb-2">
                          <Label className="font-medium">Date Published</Label>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="publication_date-asc"
                              id="date-pub-earliest"
                            />
                            <Label
                              htmlFor="date-pub-earliest"
                              className="cursor-pointer"
                            >
                              Earliest - Oldest
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="publication_date-desc"
                              id="date-pub-oldest"
                            />
                            <Label
                              htmlFor="date-pub-oldest"
                              className="cursor-pointer"
                            >
                              Oldest - Earliest
                            </Label>
                          </div>
                        </div>

                        <DropdownMenuSeparator className="-mx-2 my-1" />

                        <div className="space-y-3 mb-2">
                          <Label className="font-medium">Date Added</Label>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="created_at-asc"
                              id="date-add-earliest"
                            />
                            <Label
                              htmlFor="date-add-earliest"
                              className="cursor-pointer"
                            >
                              Earliest - Oldest
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="created_at-desc"
                              id="date-add-oldest"
                            />
                            <Label
                              htmlFor="date-add-oldest"
                              className="cursor-pointer"
                            >
                              Oldest - Earliest
                            </Label>
                          </div>
                        </div>

                        <DropdownMenuSeparator className="-mx-2 my-1" />

                        <div className="space-y-3 mb-2">
                          <Label className="font-medium">Journal Name</Label>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="journal-asc"
                              id="journal-a-z"
                            />
                            <Label
                              htmlFor="journal-a-z"
                              className="cursor-pointer"
                            >
                              A - Z
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="journal-desc"
                              id="journal-z-a"
                            />
                            <Label
                              htmlFor="journal-z-a"
                              className="cursor-pointer"
                            >
                              Z - A
                            </Label>
                          </div>
                        </div>

                        <DropdownMenuSeparator className="-mx-2 my-1" />

                        <div className="space-y-3">
                          <Label className="font-medium">Author Name</Label>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="authors-asc"
                              id="author-a-z"
                            />
                            <Label
                              htmlFor="author-a-z"
                              className="cursor-pointer"
                            >
                              A - Z
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="authors-desc"
                              id="author-z-a"
                            />
                            <Label
                              htmlFor="author-z-a"
                              className="cursor-pointer"
                            >
                              Z - A
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {showUploadButton && (
                <Button
                  onClick={onUploadPdf}
                  className="flex items-center gap-2"
                  size="sm"
                  variant="outline"
                >
                  <FileUp className="h-4 w-4" />
                  Upload PDF
                </Button>
              )}
              {sources.length > 0 && (
                <Button
                  onClick={handleToggleManage}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <ListChecks className="h-4 w-4" />
                  Manage
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="space-y-4 px-6 pb-24">
        {sortedSources.map((source, index) => (
          <LibrarySourceCard
            key={source.source_id}
            sourceId={source.source_id || `temp_${index}`}
            sourceNumber={index + 1}
            title={source.title}
            authors={source.authors}
            journal={source.journal}
            date={source.publication_date}
            citations={source.number_of_citations || 0}
            country={source.country || ""}
            doi={source.doi}
            pmid={source.pmid || ""}
            is_full_text_available={source.is_full_text_available || false}
            is_pdf_saved={source.is_pdf_saved || false}
            s3_pdf_url={source.s3_pdf_url}
            s3_text_url={source.s3_text_url}
            user_paper_title={source.user_paper_title}
            tags={source.tags || []}
            onRemove={() => onRemoveSource(source.source_id || "")}
            onMove={onMoveSource}
            folders={folders}
            currentPath={currentPath}
            isManaging={isManaging}
            isSelected={selectedSourceIds.includes(
              source.source_id || `temp_${index}`
            )}
            onSelect={(select: boolean) =>
              handleSelectSource(source.source_id || `temp_${index}`, select)
            }
          />
        ))}
      </div>

      <Dialog open={showBulkMoveDialog} onOpenChange={setShowBulkMoveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Move {selectedSourceIds.length} items to folder
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
              {currentPath !== "/" && (
                <div
                  className={`p-3 border rounded-md cursor-pointer flex items-center gap-2 ${
                    selectedBulkMoveFolderId === "/"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                  onClick={() => setSelectedBulkMoveFolderId("/")}
                >
                  <div className="flex-1">General Pool</div>
                  {selectedBulkMoveFolderId === "/" && (
                    <Check className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              )}

              {folders
                .filter((folder) => folder.folder_path !== currentPath)
                .map((folder) => (
                  <div
                    key={folder.folder_path}
                    className={`p-3 border rounded-md cursor-pointer flex items-center gap-2 ${
                      selectedBulkMoveFolderId === folder.folder_path
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() =>
                      setSelectedBulkMoveFolderId(folder.folder_path)
                    }
                  >
                    <div className="flex-1 truncate">
                      {folder.display_name ||
                        folder.folder_path.replace(/\//g, "")}
                    </div>
                    {selectedBulkMoveFolderId === folder.folder_path && (
                      <Check className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBulkMoveDialog(false);
                  setSelectedBulkMoveFolderId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!selectedBulkMoveFolderId || isBulkMoving}
                onClick={handleConfirmBulkMove}
              >
                {isBulkMoving ? "Moving..." : "Move"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LibraryListedSourceCards;
