// src/components/Sidebar/SidebarContent.tsx

import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Plus,
  MoreHorizontal,
  Trash2,
  FolderClosed,
  FolderOpen,
  Search,
  BookOpen,
} from "lucide-react";
import {
  createNewThread,
  getUserThreads,
  ThreadRef,
  getCurrentUserId,
  deleteThread,
  getThread,
} from "@/services/threadManagementApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useThreadNavigation } from "@/contexts/ThreadContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItemProps {
  icon: React.ElementType;
  text: string;
  hasChevron?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}

const NavItem = ({
  icon: Icon,
  text,
  hasChevron,
  onClick,
  collapsed,
}: NavItemProps) => {
  const content = (
    <div
      className={`flex items-center rounded-lg cursor-pointer hover:bg-accent ${
        collapsed ? "justify-center mx-1 p-2" : "justify-between mx-2 p-2 px-4"
      }`}
      onClick={onClick}
    >
      <div className={`flex items-center ${collapsed ? "justify-center" : ""} ${collapsed ? "gap-0" : "gap-3"}`}>
        <Icon className="h-5 w-5 min-w-5 min-h-5" />
        {!collapsed && <span className="text-sm">{text}</span>}
      </div>
      {hasChevron && !collapsed && (
        <ChevronDown className="h-2.5 w-2.5 text-muted-foreground opacity-60" />
      )}
    </div>
  );

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">{text}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};

interface ThreadItemProps {
  thread: ThreadRef;
  onClick: () => void;
  isSelected: boolean;
  onDelete: () => void;
  collapsed?: boolean;
}

const ThreadItem = ({
  thread,
  onClick,
  isSelected,
  onDelete,
  collapsed,
}: ThreadItemProps) => {
  // Function to determine which icon to show based on source_type
  const getIcon = () => {
    const iconProps = { className: "h-4 w-4 flex-shrink-0" }; // Common props

    switch (thread.source_type) {
      case 'pubmed':
        return <Search {...iconProps} />;
      case 'library':
        return <BookOpen {...iconProps} />;
      default:
        // Default icon when source_type is null or undefined - use magnifying glass
        return <Search {...iconProps} />;
    }
  };
  const content = (
    <div
      className={`group flex items-center rounded-lg cursor-pointer ${
        isSelected ? "bg-accent" : "hover:bg-accent/50"
      } ${
        collapsed ? "justify-center mx-1 p-2" : "justify-between mx-2 p-2 px-4"
      }`}
      onClick={onClick}
    >
      <div className={`flex items-center ${collapsed ? "justify-center" : ""} ${collapsed ? "gap-0" : "gap-2"} ${collapsed ? "w-full" : "flex-1 min-w-0"}`}>
        {/* Icon based on source_type - shown in both collapsed and expanded views */}
        <div className={`text-muted-foreground ${collapsed ? "opacity-60" : ""}`}>
          {getIcon()}
        </div>
        
        {!collapsed && (
          <span className="text-sm text-muted-foreground truncate max-w-[160px]">
            {thread.thread_name || "New Thread"}
          </span>
        )}
      </div>
      {!collapsed && (
        <div className="flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded">
                <MoreHorizontal className="h-4 w-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">
            {thread.thread_name || "New Thread"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};

interface SidebarContentProps {
  collapsed?: boolean;
  toggleSidebar?: () => void;
}

const SidebarContent = ({ collapsed = false, toggleSidebar = () => {} }: SidebarContentProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { navigateToThread } = useThreadNavigation();
  const [isThreadsExpanded, setIsThreadsExpanded] = useState(true);
  const [threads, setThreads] = useState<ThreadRef[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const currentThreadId = location.pathname.split("/").pop();

  useEffect(() => {
    const loadThreads = async () => {
      try {
        const userThreads = await getUserThreads();
        setThreads(userThreads);
      } catch (error) {
        console.error("Failed to load threads:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThreads();
  }, [refreshTrigger]);

  const handleCreateThread = async () => {
    try {
      // First check if there's already an empty "New Thread"
      const emptyThread = await findEmptyNewThread();
      
      if (emptyThread) {
        // If an empty "New Thread" exists, navigate to it instead of creating a new one
        const path = navigateToThread(emptyThread.thread_uid);
        navigate(path);
        return;
      }
      
      // Otherwise create a new thread as usual
      const userId = await getCurrentUserId();
      // When creating from sidebar, we don't know the source type yet so use the optional parameter
      const newThread = await createNewThread(userId, "New Thread");
      
      // Navigate to the new thread using the navigation hook
      const path = navigateToThread(newThread.thread_uid);
      navigate(path);
      
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to create thread:", error);
    }
  };

  const findEmptyNewThread = async (): Promise<ThreadRef | null> => {
    try {
      // Look for threads with default name "New Thread"
      const userThreads = await getUserThreads();
      const newThreads = userThreads.filter(thread => 
        thread.thread_name === "New Thread"
      );
      
      // Check each thread to see if it's empty
      for (const thread of newThreads) {
        try {
          const threadDetails = await getThread(thread.thread_uid);
          // If thread has no messages, it's considered empty
          if (threadDetails.messages.length === 0) {
            return thread;
          }
        } catch (error) {
          console.error(`Error checking thread ${thread.thread_uid}:`, error);
          // Continue checking other threads even if one fails
        }
      }
      
      return null; // No empty "New Thread" found
    } catch (error) {
      console.error("Error finding empty threads:", error);
      return null;
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      const userId = await getCurrentUserId();
      await deleteThread(userId, threadId);
      setRefreshTrigger((prev) => prev + 1);

      if (threadId === currentThreadId) {
        navigate("/");
      }
    } catch (error) {
      console.error("Failed to delete thread:", error);
    }
  };

  const handleThreadClick = (threadId: string) => {
    // Use the navigation hook to navigate to the thread
    const path = navigateToThread(threadId);
    navigate(path);
  };

  const NewThreadButton = () => {
    const content = (
      <div
        className={`flex items-center rounded-lg cursor-pointer hover:bg-accent ${
          collapsed ? "justify-center mx-1 p-2" : "justify-between mx-2 p-2 px-4"
        }`}
        onClick={handleCreateThread}
      >
        <div className={`flex items-center ${collapsed ? "justify-center" : ""} ${collapsed ? "gap-0" : "gap-3"}`}>
          <Plus className="h-5 w-5 min-w-5 min-h-5" />
          {!collapsed && <span className="text-sm">New thread</span>}
        </div>
      </div>
    );

    if (collapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right">New thread</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  return (
    <ScrollArea className="flex-1">
      <div className="py-2 space-y-1">
        <NewThreadButton />
        
        {/* Always show Threads label/icon but manage its appearance based on collapsed state */}
        <NavItem
          icon={isThreadsExpanded ? FolderOpen : FolderClosed}
          text="Threads"
          hasChevron={!collapsed}
          onClick={() => {
            if (!collapsed) {
              setIsThreadsExpanded(!isThreadsExpanded)
            } else {
              toggleSidebar();
            }
          }}
          collapsed={collapsed}
        />
        
        {/* Only show thread items if not collapsed and threads are expanded */}
        {isThreadsExpanded && !collapsed && (
          <div>
            {isLoading ? (
              <div className="flex items-center mx-2 p-2 px-4 gap-2 text-muted-foreground">
                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
                <span className="text-sm">Loading threads</span>
              </div>
            ) : threads.length > 0 ? (
              [...threads]
                .reverse()
                .map((thread) => (
                  <ThreadItem
                    key={thread.thread_uid}
                    thread={thread}
                    onClick={() => handleThreadClick(thread.thread_uid)}
                    isSelected={thread.thread_uid === currentThreadId}
                    onDelete={() => handleDeleteThread(thread.thread_uid)}
                    collapsed={collapsed}
                  />
                ))
            ) : (
              <div className="flex items-center mx-2 p-2 px-4 text-sm text-muted-foreground">
                No threads found
              </div>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default SidebarContent;
