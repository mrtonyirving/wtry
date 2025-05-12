// src/pages/AISearch.tsx

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ChatInterface from "@/components/AISearch/ChatInterface";
import ListedSources from "@/components/AISearch/ListedSources";
import { AiSearchInterfaceStarter } from "@/components/AISearch/AiSearchInterfaceStarter";
import {
  getThread,
  Thread,
  ChatMessage, // Changed from ThreadMessage to ChatMessage
  Source,
  getThreadStatus,
  getCurrentUserId,
  updateThreadMetadata,
  createNewThread,
} from "@/services/threadManagementApi";
import { chatQuery } from "@/services/chatInterfaceApi";
import { useSourceManager } from "@/hooks/useSourceManager";
import { useSidebar } from "@/contexts/SidebarContext";
import { SourceType, useThread } from "@/contexts/ThreadContext";

export default function AISearch() {
  const { threadId } = useParams();
  const sidebar = useSidebar();
  const { selectedSource, setSelectedSource } = useThread();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [thread, setThread] = useState<Thread | null>(null);
  const [hoveredSourceId, setHoveredSourceId] = useState<number | null>(null);
  const pollingInterval = useRef<number | null>(null);
  const pollingAttempts = useRef(0);
  const MAX_POLLING_ATTEMPTS = 30;
  const POLLING_INTERVAL_MS = 10000;
  const currentThreadId = useRef<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState("");

  useEffect(() => {
    console.log("[useEffect] threadId:", threadId);
    currentThreadId.current = threadId || null;

    const loadThread = async () => {
      if (!threadId || threadId === "new") {
        setThread(null); // Clear any previous thread data for "new"
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const threadData = await getThread(threadId);
        console.log("[useEffect] Loaded thread data:", threadData);
        setThread(threadData);

        // Update ThreadContext with the thread's source_type
        if (threadData && threadData.source_type) {
          console.log(`[useEffect] Setting source type to: ${threadData.source_type} for thread ${threadId}`);
          setSelectedSource(threadData.source_type);
        } else if (threadData && !threadData.source_type) {
          // Fallback if source_type is missing for an existing thread
          console.warn(`[useEffect] Thread ${threadId} loaded without source_type. Defaulting to 'pubmed'.`);
          setSelectedSource('pubmed'); // Default to pubmed
        }

        // Only start polling if the thread has messages and is not completed
        if (
          threadData.status_indicator !== "completed" &&
          threadData.messages.length > 0
        ) {
          startPolling(threadId);
        }
      } catch (error) {
        console.error("[useEffect] Failed to load thread:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThread();

    return () => {
      console.log("[useEffect cleanup] Clearing polling interval");
      if (pollingInterval.current !== null) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    };
  }, [threadId, setSelectedSource]);

  const handleSearch = async (query: string, maxSources: number, sourceType: SourceType = 'pubmed') => {
    console.log(`[handleSearch] Using source type: ${sourceType} for thread ${threadId}`);
    console.log("[handleSearch] Search query:", query, "maxSources:", maxSources, "source:", sourceType);
    setIsSearchLoading(true);
    setCurrentQuery(query);

    // Generate a temporary thread ID for immediate UI feedback
    const tempThreadId = `temp-${Date.now()}`;
    
    // Create optimistic thread data
    const optimisticThread: Thread = {
      thread_uid: tempThreadId,
      owner_uid: "", // Will be replaced with actual userId
      shared_with: [],
      messages: [{ type: "question", content: query }] as ChatMessage[], // Changed from ThreadMessage to ChatMessage
      sources: [],
      status_indicator: "searching",
    };
    
    // Immediately update UI with optimistic data
    if (!threadId || threadId === "new") {
      // For new threads, update the state right away
      setThread(optimisticThread);
      
      // Navigate immediately to show the thread view
      const optimisticPath = `/search/${tempThreadId}`;
      navigate(optimisticPath);
    } else {
      // For existing threads, add the new question optimistically
      setThread((prevThread) => {
        if (!prevThread) return optimisticThread;
        
        return {
          ...prevThread,
          messages: [
            ...prevThread.messages,
            { type: "question", content: query } as ChatMessage, // Changed from ThreadMessage to ChatMessage
          ],
          status_indicator: "searching",
        };
      });
    }

    // Now perform the actual API calls in the background
    try {
      let searchThreadId = threadId;

      // If no threadId exists or it's "new", create a new thread
      if (!searchThreadId || searchThreadId === "new") {
        const userId = await getCurrentUserId();
        // Pass the sourceType for initial thread creation
        const newThread = await createNewThread(userId, query, sourceType);
        searchThreadId = newThread.thread_uid;
        currentThreadId.current = searchThreadId;

        // Replace temporary URL with real one without causing a page refresh
        window.history.replaceState(null, "", `/search/${searchThreadId}`);
        
        // Update the thread state with the real ID
        setThread(prev => {
          if (!prev) return null;
          return {
            ...prev,
            thread_uid: searchThreadId as string, 
            owner_uid: userId
          };
        });
      }

      // Submit the search query and wait for confirmation (in background)
      const queryResponse = await chatQuery(
        query,
        searchThreadId as string, 
        maxSources,
        sourceType
      );
      console.log("[handleSearch] Chat query submitted:", queryResponse);

      // Update the thread name with the query
      const userId = await getCurrentUserId();
      await updateThreadMetadata(userId, searchThreadId as string, query, sourceType);
      console.log("[handleSearch] Thread name updated");

      // Reset polling attempts counter
      pollingAttempts.current = 0;

      // Only start polling after the query is successfully submitted
      if (queryResponse) {
        startPolling(searchThreadId as string);
      }
    } catch (error) {
      console.error("[handleSearch] Search failed:", error);
      // Show error in UI but keep the optimistic update visible
      setThread(prev => {
        if (!prev) return null;
        return {
          ...prev,
          // Use a valid status indicator instead of "error"
          status_indicator: "completed", 
        };
      });
      
      // Optionally show an error toast or notification here
      
      setIsSearchLoading(false);
    }
  };

  const startPolling = (threadId: string) => {
    console.log("[startPolling] Starting polling for threadId:", threadId);

    if (pollingInterval.current) {
      console.log(
        "[startPolling] Clearing existing interval:",
        pollingInterval.current
      );
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }

    pollingAttempts.current = 0;

    const pollThread = async () => {
      try {
        pollingAttempts.current += 1;
        console.log(
          `[pollThread] Attempt ${pollingAttempts.current} for threadId:`,
          threadId
        );

        const status = await getThreadStatus(threadId);
        console.log("[pollThread] Current thread status:", status);

        if (status === "completed") {
          console.log("[pollThread] Status completed, fetching updated thread");
          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
          }

          const updatedThread = await getThread(threadId);
          console.log("[pollThread] Updated thread fetched:", updatedThread);
          setThread(updatedThread);
          setIsSearchLoading(false);
        } else if (pollingAttempts.current >= MAX_POLLING_ATTEMPTS) {
          console.log("[pollThread] Max polling attempts reached");
          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
          }
          setIsSearchLoading(false);
        }
      } catch (error) {
        console.error("[pollThread] Error polling thread status:", error);
        if (error instanceof Error && error.message.includes("404")) {
          // Continue polling if we get a 404 - thread might not be ready yet
          return;
        }
        // Stop polling on other errors
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
          pollingInterval.current = null;
        }
        setIsSearchLoading(false);
      }
    };

    // Initial poll immediately
    pollThread();

    // Then start interval
    pollingInterval.current = window.setInterval(
      pollThread,
      POLLING_INTERVAL_MS
    );
  };

  const isSearchBarActive = () => {
    // Allow search if:
    // 1. No thread exists yet
    // 2. Thread exists but has no messages (initial state)
    // 3. Thread exists and status is 'completed' (ready for followup)
    if (!thread) return true;
    if (thread.messages.length === 0) return true;
    return thread.status_indicator === "completed";
  };

  // Transform thread messages into the format expected by ChatInterface
  const formatMessages = (messages: ChatMessage[] = []) => { // Changed from ThreadMessage to ChatMessage
    return messages.map((msg) => {
      if (msg.type === "question") {
        return {
          type: "question" as const,
          content: msg.content as string,
        };
      } else {
        const sourceIdToIndex =
          thread?.sources.reduce((acc, source, index) => {
            acc[source.pmid] = index + 1;
            return acc;
          }, {} as Record<string, number>) || {};

        return {
          type: "answer" as const,
          content: (
            msg.content as Array<{
              claim: string;
              relevant_source_quote: string;
              source_id: string;
            }>
          ).map((item) => ({
            claim: item.claim,
            relevant_source_quote: item.relevant_source_quote,
            source_id: item.source_id,
            linked_index: sourceIdToIndex[item.source_id] || null,
          })),
        };
      }
    });
  };

  const formatSources = (sources: Source[] = []) => {
    return sources.map((source, index) => ({
      sourceNumber: index + 1,
      pmid: source.pmid,
      title: source.title,
      authors: source.authors,
      journal: source.journal,
      publication_date: source.publication_date,
      abstract: source.abstract,
      keywords: source.keywords,
      mesh_terms: source.mesh_terms,
      publication_type: source.publication_type,
      pmc_id: source.pmc_id,
      country: source.country,
      citation_format: source.citation_format,
      number_of_citations: source.number_of_citations,
      relevancy_score: source.relevancy_score,
      doi: source.doi,
      is_full_text_available: source.is_full_text_available,
    }));
  };

  // Source deduplication using our custom hook
  const { uniqueSources, mapSourceIndex, totalUniqueSources } = useSourceManager(thread?.sources || []);
  const formattedUniqueSources = formatSources(uniqueSources);

  return (
    <div className="flex h-screen overflow-hidden">
      {(!threadId || threadId === "new" || (thread && thread.messages.length === 0)) ? (
        // Full-width layout for starter interface
        <div className="flex-1 min-w-0 flex justify-center">
          <div className="w-full max-w-3xl">
            <AiSearchInterfaceStarter 
              onSearch={handleSearch}
              isLoading={isSearchLoading}
            />
          </div>
        </div>
      ) : (
        // Two-column layout for active threads
        <>
          <div className="flex-1 min-w-0 flex justify-center">
            <div className="w-full max-w-[900px]">
              <ChatInterface
                onSearch={handleSearch}
                messages={thread ? formatMessages(thread.messages) : []}
                isLoading={isLoading}
                isSearchLoading={isSearchLoading}
                hoveredSourceId={hoveredSourceId}
                onSourceHover={setHoveredSourceId}
                isSearchBarActive={isSearchBarActive()}
                sources={thread?.sources || []}
                currentQuery={currentQuery}
                threadId={threadId || ""}
                mapSourceIndex={mapSourceIndex}
                totalUniqueSources={totalUniqueSources}
                selectedSources={[selectedSource]}
              />
            </div>
          </div>

          <div className="w-1/3 lg:w-1/3 xl:w-1/3 max-w-[500px]  flex-shrink-0 border-l border-gray-200 overflow-hidden">
            <ListedSources
              sidebar_open={!sidebar.collapsed}
              sources={formattedUniqueSources}
              hoveredSourceId={hoveredSourceId}
              onSourceHover={setHoveredSourceId}
              scrollOnHover={true}
              totalCount={totalUniqueSources}
            />
          </div>
        </>
      )}
    </div>
  );
}
