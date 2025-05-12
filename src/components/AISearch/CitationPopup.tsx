import React, { useRef, useEffect } from "react";
import { Answer } from "@/services/chatInterfaceApi";
import { Source } from "@/services/threadManagementApi";
import {
  getJournalAbbreviation,
  cleanJournalName,
} from "@/utils/journalAbbreviations";

interface CitationPopupProps {
  onClose: () => void;
  onCopySuccess: () => void;
  claims: Answer[];
  sources: Source[];
}

export const CitationPopup: React.FC<CitationPopupProps> = ({
  onClose,
  onCopySuccess,
  claims,
  sources,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const withLineBreaks = false;

  const formatCitation = (claim: Answer, style: string) => {
    const source = sources.find((s) => s.pmid === claim.source_id);
    if (!source) return claim.claim;

    let citation = claim.claim;
    const year = source.publication_date.match(/\d{4}/)?.[0] || "";
    const authorLastName = source.authors[0].split(",")[0].trim();

    switch (style) {
      case "NLM":
        // NLM/Vancouver style
        citation += ` [${claim.linked_index}]`;
        break;
      case "Chicago":
        // Chicago Author-Date style (just year, no months)
        citation += ` (${authorLastName} et al. ${year})`;
        break;
      case "Harvard":
        // Harvard style
        citation += ` (${authorLastName} et al., ${year})`;
        break;
      case "MLA":
        // MLA style - Note: Ideally would include page numbers if available
        citation += ` (${authorLastName})`;
        break;
      default:
        // Default style - just the claim
        break;
    }
    return citation;
  };

  const formatNLMAuthorName = (author: string) => {
    const parts = author.split(",").map((part) => part.trim());
    if (parts.length < 2) return author;

    const lastName = parts[0];
    const firstNames = parts[1]
      .split(" ")
      .map((name) => name.charAt(0))
      .join("");

    return `${lastName} ${firstNames}`;
  };

  const formatNLMTitle = (title: string) => {
    // Convert to sentence case
    return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
  };

  const handleCopy = async (style: string) => {
    try {
      let formattedText = claims
        .map((claim) => formatCitation(claim, style))
        .join(withLineBreaks ? "\n\n" : " ");

      // Add reference list for NLM style
      if (style === "NLM") {
        formattedText += "\n\nReferences:\n";
        const uniqueReferences = new Map();

        claims.forEach((claim) => {
          const source = sources.find((s) => s.pmid === claim.source_id);
          if (source && !uniqueReferences.has(claim.linked_index)) {
            uniqueReferences.set(claim.linked_index, {
              authors: source.authors.map(formatNLMAuthorName).join(", "),
              title: formatNLMTitle(source.title),
              journal: getJournalAbbreviation(cleanJournalName(source.journal)),
              year: source.publication_date.match(/\d{4}/)?.[0] || "",
              pmid: source.pmid,
              doi: source.doi,
            });
          }
        });

        // Sort references by linked_index
        const sortedReferences = Array.from(uniqueReferences.entries()).sort(
          ([a], [b]) => a - b
        );

        sortedReferences.forEach(([index, ref]) => {
          // Remove any double periods that might occur from concatenation
          let citation =
            `[${index}] ${ref.authors}. ${ref.title}. ${ref.journal}. ${ref.year}`
              .replace(/\.+/g, ".") // Replace multiple periods with a single period
              .replace(/\.\s+\./g, "."); // Replace period-space-period with a single period

          // Add PMID and DOI
          if (ref.pmid) {
            citation += `. PMID: ${ref.pmid}`;
          }
          if (ref.doi) {
            citation += `. DOI: ${ref.doi}`;
          }

          formattedText += `\n${citation}`;
        });
      }

      await navigator.clipboard.writeText(formattedText);
      onCopySuccess();
      onClose();
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="flex items-center gap-2 bg-white shadow-lg rounded-lg p-2 border border-gray-200"
    >
      <button
        onClick={() => handleCopy("NLM")}
        className="px-3 py-1 text-sm rounded-md hover:bg-blue-50 text-blue-600"
      >
        NLM
      </button>
      {/* <button
        onClick={() => handleCopy("Chicago")}
        className="px-3 py-1 text-sm rounded-md hover:bg-blue-50 text-blue-600"
      >
        Chicago
      </button>
      <button
        onClick={() => handleCopy("Harvard")}
        className="px-3 py-1 text-sm rounded-md hover:bg-blue-50 text-blue-600"
      >
        Harvard
      </button>
      <button
        onClick={() => handleCopy("MLA")}
        className="px-3 py-1 text-sm rounded-md hover:bg-blue-50 text-blue-600"
      >
        MLA
      </button> */}
      <button
        onClick={() => handleCopy("Default")}
        className="px-3 py-1 text-sm rounded-md hover:bg-blue-50 text-blue-600"
      >
        Raw
      </button>
    </div>
  );
};
