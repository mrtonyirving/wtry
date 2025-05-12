// src/components/AISearch/ChatBubbleAnswerContainer.tsx

import React from "react";
import ChatBubbleAnswerSection from "./ChatBubbleAnswerSection";
import { Answer } from "@/services/chatInterfaceApi";
import { Source } from "@/services/threadManagementApi";
import CitationButton from "./CitationButton";
import { MessageSquarePlus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatBubbleAnswerContainerProps {
  claims: Answer[];
  hoveredSourceId?: number | null;
  onSourceHover?: (id: number | null) => void;
  sources: Source[];
  query?: string;
  threadId?: string;
  mapSourceIndex?: (originalIndex: number) => number;
  containerRef?: React.RefObject<HTMLDivElement>;
}

const ChatBubbleAnswerContainer: React.FC<ChatBubbleAnswerContainerProps> = ({
  claims,
  onSourceHover,
  sources,
  query,
  threadId,
  mapSourceIndex = (i) => i, // Default to identity function if not provided
  containerRef,
}) => {
  const feedbackUrl = `https://docs.google.com/forms/d/e/1FAIpQLSdXdUXM-cHGRGwVr6IyW-wY6IsLQQbN_i9hcwAP94crGPpU1g/viewform?usp=dialog&entry.31432690=${encodeURIComponent(
    query || ""
  )}&entry.1992166327=${encodeURIComponent(threadId || "")}`;

  // Function to get the mapped source reference
  const getSourceReference = (linkedIndex: number | null): number | null => {
    if (linkedIndex === null) return null;
    // Convert to zero-based index, map it, then convert back to one-based index
    return mapSourceIndex(linkedIndex - 1) + 1;
  };

  return (
    <div className="relative w-full rounded-lg border border-gray-200 bg-white">
      <div>
        <div className="absolute top-2 left-4 flex items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => window.open(feedbackUrl, "_blank")}
                  className="p-2 rounded-md inline-flex items-center justify-center bg-white hover:bg-gray-100 focus-visible:ring-1 focus-visible:ring-gray-400"
                >
                  <MessageSquarePlus className="h-5 w-5 text-gray-500" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Provide feedback</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <CitationButton claims={claims} sources={sources} />
        </div>
      </div>

      <div className="px-6 py-3 pt-12">
        <div className="space-y-2">
          {claims.reduce((acc: JSX.Element[], claim, index) => {
            const currentSourceId = claim.linked_index;
            const prevSourceId =
              index > 0 ? claims[index - 1].linked_index : null;

            // Get the mapped source references
            const mappedCurrentSourceId = getSourceReference(currentSourceId);
            const mappedPrevSourceId = getSourceReference(prevSourceId);

            if (index === 0 || mappedCurrentSourceId !== mappedPrevSourceId) {
              acc.push(
                <div key={`block-${index}`} className="block whitespace-normal">
                  <ChatBubbleAnswerSection
                    claim={claim.claim}
                    relevant_source_quote={claim.relevant_source_quote}
                    source_id={String(mappedCurrentSourceId)}
                    onHover={onSourceHover}
                    isFirst={true}
                    containerRef={containerRef}
                  />
                </div>
              );
            } else {
              const lastBlock = acc[acc.length - 1];
              const updatedBlock = (
                <div
                  key={`block-${index - 1}`}
                  className="block whitespace-normal"
                >
                  {lastBlock.props.children}
                  <ChatBubbleAnswerSection
                    claim={claim.claim}
                    relevant_source_quote={claim.relevant_source_quote}
                    source_id={String(mappedCurrentSourceId)}
                    onHover={onSourceHover}
                    isFirst={false}
                    containerRef={containerRef}
                  />
                </div>
              );
              acc[acc.length - 1] = updatedBlock;
            }
            return acc;
          }, [])}
        </div>
      </div>
    </div>
  );
};

export default ChatBubbleAnswerContainer;
