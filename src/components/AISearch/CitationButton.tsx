import React, { useState } from "react";
import { Answer } from "@/services/chatInterfaceApi";
import { Source } from "@/services/threadManagementApi";
import { CitationPopup } from "./CitationPopup";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CitationButtonProps {
  claims: Answer[];
  sources: Source[];
}

const CitationButton: React.FC<CitationButtonProps> = ({ claims, sources }) => {
  const [showCopyOptions, setShowCopyOptions] = useState(false);
  const [copiedStyle, setCopiedStyle] = useState<string | null>(null);

  const handleClose = () => {
    setShowCopyOptions(false);
  };

  const handleCopySuccess = () => {
    setCopiedStyle("Copied!");
    setTimeout(() => setCopiedStyle(null), 1000);
  };

  return (
    <div className="h-9 flex items-center">
      {showCopyOptions ? (
        <CitationPopup
          onClose={handleClose}
          onCopySuccess={handleCopySuccess}
          claims={claims}
          sources={sources}
        />
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowCopyOptions(true)}
                className={`p-2 rounded-md hover:bg-gray-100 h-9 w-9 flex items-center justify-center ${
                  copiedStyle ? "text-green-600 pl-8" : "text-gray-600"
                }`}
              >
                {copiedStyle ? (
                  <span className="text-sm">Copied!</span>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy with citation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default CitationButton;
