import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { ChatMessage } from '@/services/chatApi';
import { StoredSource } from '@/services/libraryManagementApi';

// Define the context interface
interface ChatContextType {
  currentSourceId: string | null;
  setCurrentSourceId: (sourceId: string | null) => void;
  messageHistory: ChatMessage[];
  setMessageHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  sourceData: StoredSource | null;
  setSourceData: React.Dispatch<React.SetStateAction<StoredSource | null>>;
  isSourceLoading: boolean;
  setIsSourceLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isChatLoading: boolean;
  setIsChatLoading: React.Dispatch<React.SetStateAction<boolean>>;
  sourceError: string | null;
  setSourceError: React.Dispatch<React.SetStateAction<string | null>>;
  chatError: string | null;
  setChatError: React.Dispatch<React.SetStateAction<string | null>>;
  clearChatContext: () => void;
}

// Create the context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Create the provider component
export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with values from sessionStorage if available
  const [currentSourceId, setCurrentSourceIdState] = useState<string | null>(() => {
    const savedSourceId = sessionStorage.getItem('currentChatSourceId');
    return savedSourceId || null;
  });
  
  const [messageHistory, setMessageHistory] = useState<ChatMessage[]>(() => {
    const savedMessages = sessionStorage.getItem('chatMessageHistory');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  
  const [sourceData, setSourceData] = useState<StoredSource | null>(() => {
    const savedSourceData = sessionStorage.getItem('chatSourceData');
    return savedSourceData ? JSON.parse(savedSourceData) : null;
  });
  
  const [isSourceLoading, setIsSourceLoading] = useState<boolean>(false);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  
  // Update sessionStorage when currentSourceId changes
  const setCurrentSourceId = useCallback((sourceId: string | null) => {
    setCurrentSourceIdState(sourceId);
    if (sourceId) {
      sessionStorage.setItem('currentChatSourceId', sourceId);
    } else {
      sessionStorage.removeItem('currentChatSourceId');
    }
  }, []);
  
  // Update sessionStorage when messageHistory changes
  useEffect(() => {
    if (messageHistory.length > 0) {
      sessionStorage.setItem('chatMessageHistory', JSON.stringify(messageHistory));
    } else {
      sessionStorage.removeItem('chatMessageHistory');
    }
  }, [messageHistory]);
  
  // Update sessionStorage when sourceData changes
  useEffect(() => {
    if (sourceData) {
      sessionStorage.setItem('chatSourceData', JSON.stringify(sourceData));
    } else {
      sessionStorage.removeItem('chatSourceData');
    }
  }, [sourceData]);
  
  // Function to clear all chat context data
  const clearChatContext = useCallback(() => {
    setCurrentSourceIdState(null);
    setMessageHistory([]);
    setSourceData(null);
    setSourceError(null);
    setChatError(null);
    sessionStorage.removeItem('currentChatSourceId');
    sessionStorage.removeItem('chatMessageHistory');
    sessionStorage.removeItem('chatSourceData');
  }, []);
  
  // Create the context value object
  const contextValue: ChatContextType = {
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
    clearChatContext
  };
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Create a custom hook to use the context
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
