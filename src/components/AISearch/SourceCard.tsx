// src/components/AISearch/SourceCard.tsx

import {
  Folder,
  Link,
  Quote,
  Calendar,
  BookOpen,
  Users2,
  MapPin,
  // Bookmark,
  CheckCircle,
  XCircle,
  Check,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatAuthors,
  formatDate,
  getCitation,
} from "@/utils/CardCitationFormatting";
import SourceCardSaveToLibrary from "./SourceCardSaveToLibrary";

interface SourceCardProps {
  sourceNumber?: number;
  title?: string;
  authors?: string[];
  journal?: string;
  date?: string;
  citations?: number;
  country?: string | null;
  doi?: string | null;
  pmid?: string;
  isHovered?: boolean;
  onHover?: (id: number | null) => void;
  is_full_text_available?: boolean;
  abstract?: string;
  keywords?: string[];
  mesh_terms?: string[];
  publication_type?: string[];
  pmc_id?: string | null;
  citation_format?: string;
  number_of_citations?: number;
  relevancy_score?: number;
  sidebar_open?: boolean;
}

export default function SourceCard({
  sourceNumber = 1,
  title = "Untitled Paper",
  authors = [],
  journal = "Unknown Journal",
  date = "No Date",
  // citations = 0,
  country = null,
  doi = null,
  pmid = "",
  is_full_text_available = false,
  isHovered = false,
  onHover,
  abstract = "",
  keywords = [],
  mesh_terms = [],
  publication_type = [],
  pmc_id = null,
  citation_format = "",
  number_of_citations = 0,
  relevancy_score = 0,
  sidebar_open = false,
}: SourceCardProps): JSX.Element {
  const [showCitationPopup, setShowCitationPopup] = useState(false);
  const [showCopiedIndicator, setShowCopiedIndicator] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  // const SHOW_CITATIONS = false;

  if (country === "USA") {
    country = "United States";
  }

  let initials = "";

  if (country && (country ?? "").split(" ").length > 1) {
    initials = country.split(" ").map((word) => word[0]).join("");
  } else if (country) {
    initials = country.slice(0, 2).toUpperCase();
  }

  initials = initials.toUpperCase();

  const copyToClipboard = async (style: string) => {
    const citation = getCitation(style, { authors, title, journal, date, doi });
    await navigator.clipboard.writeText(citation);
    setShowCopiedIndicator(true);
    setShowCitationPopup(false);
    setTimeout(() => setShowCopiedIndicator(false), 900);
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

  const handleSaveToLibrary = () => {
    if (isSaved) return;
    setShowSaveDialog(true);
  };

  const handleSaveSuccess = () => {
    setIsSaved(true);
    setShowSaveDialog(false);
  };

  return (
    <div
      className={`rounded-xl border p-4 w-full bg-white text-left transition-colors ${
        isHovered ? "border-blue-600" : "border-gray-200 hover:border-blue-600"
      }`}
      onMouseEnter={() => onHover?.(sourceNumber)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div
            className={`w-5 h-5 rounded-full grid place-items-center transition-colors ${
              isHovered ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800"
            }`}
          >
            <span className="text-xs leading-none">{sourceNumber}</span>
          </div>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 truncate overflow-hidden max-w-full">
          {title}
        </h2>
      </div>

      <div className="mt-2 text-gray-500 text-sm space-y-1">
        <div className="flex items-center gap-2 font-medium truncate max-w-full">
          <BookOpen className="h-4 w-4 flex-shrink-0 text-gray-400" />
          <span className="truncate">{journal}</span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 truncate max-w-[50%] xl:max-w-[75%]">
            <Users2 className="h-4 w-4 flex-shrink-0 text-gray-400" />
            <span className="truncate">{formatAuthors(authors)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="h-4 w-4" />
            <span className="items-center flex flex-row truncate">
              <span className={`hidden ${sidebar_open ? "lg:flex" : "md:flex"}`}>{!country ? "Not available" : country}</span>
              <span className={`flex ${sidebar_open ? "lg:hidden" : "md:hidden"}`}>{!country ? "N/A" : initials}</span>
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(date)}</span>
          </div>
          {is_full_text_available ? (
            <span className="text-green-600 items-center flex flex-row gap-2 truncate"><CheckCircle className="h-4 w-4" /> PMC <span className={`hidden ${sidebar_open ? "lg:flex" : "md:flex"}`}>text available</span></span>
          ) : (
            <span className="text-gray-400 items-center flex flex-row gap-2 truncate"><XCircle className="h-4 w-4" /> PMC <span className={`hidden ${sidebar_open ? "lg:flex" : "md:flex"}`}>text unavailable</span></span>
          )}
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
              <img src="/pubmed.svg" alt="PubMed" className="h-4 opacity-50" />
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleSaveToLibrary}
                disabled={isSaved}
                className={`relative ${
                  isSaved ? "text-green-500" : "hover:text-blue-600"
                } transition-colors`}
              >
                {isSaved ? (
                  <>
                    <Folder className="w-5 h-5" />
                    <Check className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
                  </>
                ) : (
                  <Folder className="w-5 h-5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isSaved ? "Saved to library" : "Save to library"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Save to Library Dialog */}
      {showSaveDialog && (
        <SourceCardSaveToLibrary
          isOpen={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          sourceData={{
            title,
            authors,
            journal,
            publication_date: date,
            abstract,
            keywords,
            mesh_terms,
            publication_type,
            pmc_id,
            country,
            citation_format,
            number_of_citations,
            relevancy_score,
            doi,
            pmid,
            is_full_text_available,
            tags: [],
          }}
          onSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
}
