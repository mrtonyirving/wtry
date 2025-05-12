// src/pages/Chat.tsx

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChatMessage, fetchChatResponse } from "@/services/chatApi";
import { getUserSource } from "@/services/libraryManagementApi";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import PaperDisplay from "@/components/Chat/PaperDisplay";
import ChatInterface from "@/components/Chat/ChatInterface";
import { Loader2, BookOpen, AlertTriangle } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";

export default function Chat() {
  // Get source ID from URL params
  const { sourceId } = useParams<{ sourceId: string }>();
  const navigate = useNavigate();

  // Use our ChatContext
  const {
    currentSourceId,
    setCurrentSourceId,
    messageHistory,
    setMessageHistory,
    sourceData,
    setSourceData,
    isSourceLoading,
    setIsSourceLoading,
    isChatLoading,
    setIsChatLoading,
    sourceError,
    setSourceError,
    chatError,
    setChatError,
  } = useChat();

  // Effect to handle source loading when URL contains a source ID
  useEffect(() => {
    const handleSourceIdChange = async () => {
      // Check if we have a valid sourceId from URL (not undefined and not 'chat')
      if (sourceId && sourceId !== "chat") {
        console.log(`[Chat] URL has sourceId: ${sourceId}`);

        // Always attempt to load when navigating to a specific URL with sourceId
        setIsSourceLoading(true);
        setSourceError(null);
        setCurrentSourceId(sourceId);

        try {
          console.log(`[Chat] Fetching source data for ID: ${sourceId}`);
          const data = await getUserSource(sourceId);
          if (data) {
            console.log(`[Chat] Successfully loaded source data:`, data.title);
            setSourceData(data);
          } else {
            throw new Error("Received invalid data from API.");
          }
        } catch (err) {
          console.error(`Error fetching source data for ID ${sourceId}:`, err);
          setSourceError(
            err instanceof Error
              ? `Failed to load paper details: ${err.message}`
              : "Failed to load paper details."
          );
          setSourceData(null);
        } finally {
          setIsSourceLoading(false);
        }
      } else if (sourceId === undefined && currentSourceId) {
        // We're at /chat but we have a currentSourceId in context, so redirect to that source
        console.log(
          `[Chat] Redirecting to stored sourceId: ${currentSourceId}`
        );
        navigate(`/chat/${currentSourceId}`, { replace: true });
      }
    };

    handleSourceIdChange();
  }, [
    sourceId,
    navigate,
    setCurrentSourceId,
    setMessageHistory,
    setSourceData,
    setIsSourceLoading,
    setSourceError,
    currentSourceId,
  ]);

  // Handle sending a new chat message
  const handleSendMessage = async (userMessage: string) => {
    if (!sourceData || !sourceData.s3_text_url) {
      setChatError("Cannot send message: Source text URL is missing.");
      console.error("s3_text_url missing in sourceData:", sourceData);
      return;
    }
    const paperUid = sourceData.s3_text_url;
    if (!userMessage.trim()) return;
    const newUserMessage: ChatMessage = { role: "user", content: userMessage };
    const updatedHistory = [...messageHistory, newUserMessage];
    setMessageHistory(updatedHistory);
    setIsChatLoading(true);
    setChatError(null);
    try {
      console.log(
        `Sending chat request with paper_uid (s3_text_url): ${paperUid}`
      );
      const response = await fetchChatResponse(paperUid, updatedHistory);
      const agentMessage: ChatMessage = { role: "agent", content: response };
      setMessageHistory([...updatedHistory, agentMessage]);
    } catch (err) {
      console.error("Error fetching chat response:", err);
      setChatError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsChatLoading(false);
    }
  };

  // If we're currently loading the source, show loading state
  if (isSourceLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
        <span>Loading paper details...</span>
      </div>
    );
  }

  // If no source is selected (either in URL or context), show prompt to select one from library
  if ((!sourceId || sourceId === "chat") && !currentSourceId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-600 p-4 text-center">
        <BookOpen className="h-16 w-16 mb-4 text-gray-400" />
        <h2 className="text-2xl font-semibold mb-2">No Source Selected</h2>
        <p className="text-lg mb-6 max-w-md">
          Please select a document from your library to start a chat
          conversation about it.
        </p>
        <Button
          onClick={() => navigate("/library")}
          className="bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          Go to Library
        </Button>
      </div>
    );
  }

  // Error state
  if (sourceError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-600 p-4 text-center">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <span>{sourceError}</span>
        <Button
          onClick={() => navigate("/library")}
          className="mt-4 bg-blue-600 hover:bg-blue-700"
        >
          Back to Library
        </Button>
      </div>
    );
  }

  // If we're waiting for source data but have a valid sourceId
  if (!sourceData && sourceId && sourceId !== "chat") {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
        <span>Loading paper details...</span>
      </div>
    );
  }

  // If loading finished, no errors, and sourceData exists, render the chat interface
  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={50} minSize={30}>
        <PaperDisplay s3PdfUrl={sourceData?.s3_pdf_url || ""} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50} minSize={30}>
        <div className="h-full flex flex-col">
          <ChatInterface
            messageHistory={messageHistory}
            isLoading={isChatLoading}
            error={chatError}
            onSendMessage={handleSendMessage}
          />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
