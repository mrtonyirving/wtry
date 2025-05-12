// src/components/AISearch/ChatInterface.tsx

import { ScrollArea } from "@/components/ui/scroll-area";
import { Answer } from "@/services/chatInterfaceApi";
import { Source } from "@/services/threadManagementApi";
import { useRef, useState } from "react";
import ChatBubbleAnswerContainer from "./ChatBubbleAnswerContainer";
import ChatBubbleQuestion from "./ChatBubbleQuestion";
import { SearchInput } from "./SearchInput";
import LoadingStates from "./LoadingStates";
import { SourceType } from "@/contexts/ThreadContext";

interface ChatMessage {
  type: "question" | "answer";
  content: string | Answer[];
}

interface ChatInterfaceProps {
  onSearch: (query: string, maxSources: number, sourceType: SourceType) => Promise<void>;
  messages: ChatMessage[];
  isLoading: boolean;
  isSearchLoading: boolean;
  hoveredSourceId?: number | null;
  onSourceHover?: (id: number | null) => void;
  isSearchBarActive: boolean;
  sources: Source[];
  currentQuery?: string;
  threadId?: string;
  mapSourceIndex?: (originalIndex: number) => number;
  totalUniqueSources?: number;
  selectedSources?: SourceType[];
}

export default function ChatInterface({
  onSearch,
  messages,
  isLoading,
  isSearchLoading,
  hoveredSourceId,
  onSourceHover,
  isSearchBarActive,
  sources,
  currentQuery = "",
  threadId = "",
  mapSourceIndex = (i) => i,
  selectedSources,
}: ChatInterfaceProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Save and restore scroll position when sources are hovered
  const [savedScrollPosition, setSavedScrollPosition] = useState<number | null>(null);
  
  // Create a custom onSourceHover handler that preserves scroll position
  const handleSourceHover = (id: number | null) => {
    // When starting to hover a source, save current scroll position if not already saved
    if (id !== null && savedScrollPosition === null) {
      const chatScrollArea = document.querySelector('.chat-scroll-area > [data-radix-scroll-area-viewport]');
      if (chatScrollArea) {
        setSavedScrollPosition(chatScrollArea.scrollTop);
      }
    }
    
    // When hover ends, restore the scroll position
    if (id === null && savedScrollPosition !== null) {
      setTimeout(() => {
        const chatScrollArea = document.querySelector('.chat-scroll-area > [data-radix-scroll-area-viewport]');
        if (chatScrollArea) {
          chatScrollArea.scrollTop = savedScrollPosition;
        }
        setSavedScrollPosition(null);
      }, 50);
    }
    
    // Call the original onSourceHover function
    if (onSourceHover) {
      onSourceHover(id);
    }
  };

  return (
    <div ref={containerRef} className="w-full h-screen bg-background overflow-hidden">
      <div className="flex flex-col h-full">
        <ScrollArea 
          ref={scrollAreaRef} 
          className="flex-1 px-4 overflow-auto chat-scroll-area" 
          scrollHideDelay={0}
        >
          <div className="space-y-4 py-4">
            {messages.map((message, index) => (
              <div key={index}>
                {message.type === "question" ? (
                  <ChatBubbleQuestion message={message.content as string} />
                ) : (
                  <ChatBubbleAnswerContainer
                    claims={message.content as Answer[]}
                    hoveredSourceId={hoveredSourceId}
                    onSourceHover={handleSourceHover}
                    sources={sources}
                    query={currentQuery}
                    threadId={threadId}
                    mapSourceIndex={mapSourceIndex}
                    containerRef={containerRef}
                  />
                )}
              </div>
            ))}

            {isSearchLoading && (
              <div className="flex justify-center w-full">
                <div className="w-full">
                  <LoadingStates />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="bg-white">
          <SearchInput
            onSearch={onSearch}
            isLoading={isLoading}
            isSearchBarActive={isSearchBarActive}
            isFollowup={messages.length > 0}
            selectedSources={selectedSources}
          />
        </div>
      </div>
    </div>
  );
}
