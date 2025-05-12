// src/components/Sidebar/Sidebar.tsx

import SidebarContent from "./SidebarContent";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { Button } from "../ui/button";

const Sidebar = () => {
  const { collapsed, toggleSidebar } = useSidebar();

  return (
    <div className="relative">
      <div
        className={`flex flex-col h-full border-r bg-background transition-all duration-200 ease-in-out ${
          collapsed ? "w-[60px]" : "w-[150px] md:w-[160px] lg:w-[200px] xl:w-[260px]"
        }`}
      >
        <SidebarContent collapsed={collapsed} toggleSidebar={toggleSidebar} />
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={toggleSidebar}
        className="absolute -right-[18px] top-[30px] rounded-full z-10"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-5 w-5" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
};

export default Sidebar;
