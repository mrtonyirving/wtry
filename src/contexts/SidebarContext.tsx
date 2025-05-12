import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

// Define the context interface
interface SidebarContextType {
  collapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (isCollapsed: boolean) => void;
}

// Create the context
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// Create the provider component
export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with value from sessionStorage if available
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const savedState = sessionStorage.getItem('sidebarCollapsed');
    return savedState ? JSON.parse(savedState) : false;
  });

  // Function to update the collapsed state and save to sessionStorage
  const setSidebarCollapsed = useCallback((isCollapsed: boolean) => {
    setCollapsed(isCollapsed);
    sessionStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, []);

  // Toggle function for easier use
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(!collapsed);
  }, [collapsed, setSidebarCollapsed]);

  // Create the context value object with useMemo to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    collapsed,
    toggleSidebar,
    setSidebarCollapsed,
  }), [collapsed, toggleSidebar, setSidebarCollapsed]);

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
};

// Create a custom hook to use the context
export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
