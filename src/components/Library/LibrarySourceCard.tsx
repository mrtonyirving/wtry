import {
  Folder,
  Link,
  Quote,
  Calendar,
  BookOpen,
  Users2,
  MapPin,
  CheckCircle,
  XCircle,
  Trash2,
  Check,
  MessageSquare,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  formatAuthors,
  formatDate,
  getCitation,
} from "@/utils/CardCitationFormatting";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FolderInfo } from "@/services/libraryFolderManagementApi";
import { useChat } from "@/contexts/ChatContext";
import { Checkbox } from "@/components/ui/checkbox";

interface LibrarySourceCardProps {
  sourceId: string;
  sourceNumber?: number;
  title?: string;
  authors?: string[];
  journal?: string;
  date?: string;
  citations?: number;
  country?: string;
  doi?: string | null;
  pmid?: string;
  is_full_text_available?: boolean;
  is_pdf_saved?: boolean;
  s3_pdf_url?: string;
  s3_text_url?: string;
  tags?: string[];
  onRemove?: () => void;
  onMove?: (sourceId: string, newPath: string) => Promise<void>;
  folders?: FolderInfo[];
  currentPath?: string;
  user_paper_title?: string | null;
  isManaging?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}

// Tag color mapping based on tag name
const getTagColor = (tagName: string) => {
  if (tagName === "Tag 1") return "#8b5cf6"; // Purple for Tag 1
  if (tagName === "Tag 2") return "#ec4899"; // Pink for Tag 2
  if (tagName === "Tag 3") return "#f97316"; // Orange for Tag 3
  return "#6b7280"; // Default gray
};

export default function LibrarySourceCard({
  sourceId,
  sourceNumber = 1,
  title = "Untitled Paper",
  user_paper_title = null,
  authors = [],
  journal = "Unknown Journal",
  date = "No Date",
  country = "n/a",
  doi = null,
  pmid = "",
  is_full_text_available = false,
  is_pdf_saved = false,
  // These URLs are used in the chat page after navigation, required for proper component interface
  s3_pdf_url, // Used after navigation to /chat/{sourceId}
  s3_text_url, // Used after navigation to /chat/{sourceId}
  tags = [],
  onRemove,
  onMove,
  folders = [],
  currentPath = "/",
  isManaging = false,
  isSelected = false,
  onSelect = () => {},
}: LibrarySourceCardProps): JSX.Element {
  const [showCitationPopup, setShowCitationPopup] = useState(false);
  const [showCopiedIndicator, setShowCopiedIndicator] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Use ChatContext
  const { setCurrentSourceId, clearChatContext } = useChat();

  const copyToClipboard = async (style: string) => {
    const citation = getCitation(style, { authors, title, journal, date, doi });
    await navigator.clipboard.writeText(citation);
    setShowCopiedIndicator(true);
    setShowCitationPopup(false);
    setTimeout(() => setShowCopiedIndicator(false), 900);
  };

  const handleMoveSource = async () => {
    if (!selectedFolderId || !onMove) return;

    setIsMoving(true);
    try {
      await onMove(sourceId, selectedFolderId);
      setShowMoveDialog(false);
      setSelectedFolderId(null);
    } catch (error) {
      console.error("Failed to move source:", error);
    } finally {
      setIsMoving(false);
    }
  };

  const handleChatClick = () => {
    // Ensure the button should be active (PDF saved) and sourceId is available
    if (is_pdf_saved && sourceId) {
      // Set the current source ID in the ChatContext before navigating
      clearChatContext(); // Clear previous chat context
      setCurrentSourceId(sourceId); // Set new source ID

      // Navigate to chat page
      const chatUrl = `/chat/${sourceId}`;
      console.log(
        `Navigating to chat page for source: ${sourceId} via URL: ${chatUrl}`
      );
      console.log(
        `Source has PDF URL: ${!!s3_pdf_url}, Text URL: ${!!s3_text_url}`
      );
      navigate(chatUrl);
    } else {
      console.error("Cannot navigate to chat. Conditions not met:", {
        is_pdf_saved,
        sourceId,
      });
    }
  };

  const handleCardClick = () => {
    if (isManaging) {
      onSelect(!isSelected); // Call the onSelect prop passed from parent
    }
    // If not managing, clicking the card could potentially do something else in the future,
    // like navigate to a detail view, but for now, it does nothing.
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setShowCitationPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-3 w-full">
      {isManaging && (
        <div className="flex-shrink-0">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            aria-label={`Select ${title}`}
            className="data-[state=checked]:bg-blue-600 data-[state=checked]:text-blue-50 data-[state=checked]:border-blue-600"
          />
        </div>
      )}
      <div
        onClick={handleCardClick}
        className={`flex-1 min-w-0 rounded-xl border p-4 bg-white text-left transition-colors ${
          isSelected
            ? "border-blue-600 bg-blue-50"
            : "border-gray-200 hover:border-blue-600"
        } ${isManaging ? "w-auto cursor-pointer" : "w-full"}`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex-shrink-0 pt-1">
              <div className="w-5 h-5 rounded-full grid place-items-center bg-blue-100 text-blue-800">
                <span className="text-xs leading-none">{sourceNumber}</span>
              </div>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {title}
              </h2>
              {user_paper_title && (
                <p className="text-sm text-gray-500 truncate mt-0.5">
                  {user_paper_title}
                </p>
              )}
            </div>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 ml-4 flex-shrink-0">
              {tags.map((tag, index) => {
                const color = getTagColor(tag);
                return (
                  <Badge
                    key={index}
                    variant="outline"
                    className="px-4 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${color}15`,
                      color: color,
                      borderColor: `${color}30`,
                    }}
                  >
                    {tag}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-2 text-gray-500 text-sm space-y-1 pl-8">
          <div className="flex items-center gap-2 font-medium truncate max-w-full">
            <BookOpen className="h-4 w-4 flex-shrink-0 text-gray-400" />
            <span className="truncate">{journal}</span>
          </div>

          <div className="flex items-center gap-2 truncate max-w-full">
            <Users2 className="h-4 w-4 flex-shrink-0 text-gray-400" />
            <span className="truncate">{formatAuthors(authors)}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(date)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{country}</span>
            </div>
            <div className="flex gap-4">
              {is_pdf_saved ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>PDF saved</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-400">
                  <XCircle className="h-4 w-4" />
                  <span>No PDF</span>
                </div>
              )}

              {is_full_text_available ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>PMC text available</span>
                </div>
              ) : (
                !is_pdf_saved && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <XCircle className="h-4 w-4" />
                    <span>PMC text unavailable</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 relative">
            <TooltipProvider>
              {pmid ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-80 transition-opacity"
                    >
                      <img src="/pubmed.svg" alt="PubMed" className="h-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View on PubMed</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <img
                  src="/pubmed.svg"
                  alt="PubMed"
                  className="h-4 opacity-50"
                />
              )}

              {doi ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={`https://doi.org/${doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition-colors"
                    >
                      <Link className="w-5 h-5" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View DOI</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Link className="w-5 h-5 text-gray-300" />
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => setShowCitationPopup(true)}>
                    <Quote
                      className={`w-5 h-5 transition-colors cursor-pointer ${
                        showCopiedIndicator
                          ? "text-green-500"
                          : "hover:text-blue-600"
                      }`}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy citation</p>
                </TooltipContent>
              </Tooltip>

              {is_pdf_saved && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleChatClick}
                      className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Chat
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Chat with this source</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>

            {showCitationPopup && (
              <div
                ref={popupRef}
                className="absolute left-0 top-8 z-50 flex items-center gap-2 bg-white shadow-lg rounded-lg p-2 border border-gray-200"
              >
                {["NLM", "Raw"].map((style) => (
                  <button
                    key={style}
                    onClick={() => copyToClipboard(style)}
                    className="px-3 py-1 text-sm rounded-md hover:bg-blue-50 text-blue-600"
                  >
                    {style}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => setShowMoveDialog(true)}>
                    <Folder className="w-5 h-5 hover:text-blue-600 transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Move to folder</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="hover:text-red-600 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove from library?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove "{title}" from your library?
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onRemove}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Move to folder</DialogTitle>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                {currentPath !== "/" && (
                  <div
                    className={`p-3 border rounded-md cursor-pointer flex items-center gap-2 ${
                      selectedFolderId === "/"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => setSelectedFolderId("/")}
                  >
                    <div className="flex-1">General Pool</div>
                    {selectedFolderId === "/" && (
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
                        selectedFolderId === folder.folder_path
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                      onClick={() => setSelectedFolderId(folder.folder_path)}
                    >
                      <div className="flex-1 truncate">
                        {folder.display_name ||
                          folder.folder_path.replace(/\//g, "")}
                      </div>
                      {selectedFolderId === folder.folder_path && (
                        <Check className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMoveDialog(false);
                    setSelectedFolderId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={!selectedFolderId || isMoving}
                  onClick={handleMoveSource}
                >
                  {isMoving ? "Moving..." : "Move"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
