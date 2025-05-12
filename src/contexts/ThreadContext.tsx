import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

// Define the source types
export type SourceType = 'pubmed' | 'library';

// Define the context interface
interface ThreadContextType {
  activeThreadId: string | null;
  setActiveThreadId: (threadId: string | null) => void;
  selectedSource: SourceType;
  setSelectedSource: (source: SourceType) => void;
}

// Create the context
const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

// Create the provider component
export const ThreadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with value from sessionStorage if available
  const [activeThreadId, setActiveThreadIdState] = useState<string | null>(() => {
    const savedThreadId = sessionStorage.getItem('activeThreadId');
    return savedThreadId ? savedThreadId : null;
  });

  // Initialize selectedSource from sessionStorage if available
  const [selectedSource, setSelectedSourceState] = useState<SourceType>(() => {
    // Try to get thread-specific source first
    if (sessionStorage.getItem('activeThreadId')) {
      const threadId = sessionStorage.getItem('activeThreadId');
      const threadSource = sessionStorage.getItem(`source_${threadId}`);
      if (threadSource) {
        return JSON.parse(threadSource) as SourceType;
      }
    }
    
    // Fall back to global source
    const globalSource = sessionStorage.getItem('globalSelectedSource');
    return globalSource ? JSON.parse(globalSource) as SourceType : 'pubmed'; // Default to PubMed
  });

  // Debounced sessionStorage update for thread ID
  const setActiveThreadId = useCallback((threadId: string | null) => {
    setActiveThreadIdState(threadId);
    
    // Update sessionStorage
    if (threadId) {
      sessionStorage.setItem('activeThreadId', threadId);
    } else {
      sessionStorage.removeItem('activeThreadId');
    }
  }, []);

  // Update source with persistence
  const setSelectedSource = useCallback((source: SourceType) => {
    setSelectedSourceState(source);
    
    // Update global source
    sessionStorage.setItem('globalSelectedSource', JSON.stringify(source));
    
    // If we have an active thread, also save source for this thread
    const threadId = sessionStorage.getItem('activeThreadId');
    if (threadId) {
      sessionStorage.setItem(`source_${threadId}`, JSON.stringify(source));
    }
  }, []);

  // Create the context value object with useMemo to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    activeThreadId,
    setActiveThreadId,
    selectedSource,
    setSelectedSource,
  }), [activeThreadId, setActiveThreadId, selectedSource, setSelectedSource]);

  return (
    <ThreadContext.Provider value={contextValue}>
      {children}
    </ThreadContext.Provider>
  );
};

// Create a custom hook to use the context
export const useThread = (): ThreadContextType => {
  const context = useContext(ThreadContext);
  if (context === undefined) {
    throw new Error('useThread must be used within a ThreadProvider');
  }
  return context;
};

// Custom hook for thread navigation
export const useThreadNavigation = () => {
  const { activeThreadId, setActiveThreadId } = useThread();
  
  // Function to navigate to a thread
  const navigateToThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
    return `/search/${threadId}`;
  }, [setActiveThreadId]);
  
  // Function to get the path for the current thread or create a new one
  const getCurrentThreadPath = useCallback(() => {
    return activeThreadId ? `/search/${activeThreadId}` : '/search/new';
  }, [activeThreadId]);
  
  return { 
    navigateToThread,
    getCurrentThreadPath,
    activeThreadId
  };
};
