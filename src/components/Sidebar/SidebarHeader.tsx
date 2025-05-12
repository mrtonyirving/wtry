// src/components/Sidebar/SidebarHeader.tsx

import { Button } from '@/components/ui/button';

const SidebarHeader = () => (
  <div className="px-2">
    <Button 
      variant="ghost" 
      className="w-full px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-accent"
    >
      <img src="/new-thread.svg" className="h-5 w-5" />
      <span>New thread</span>
    </Button>
  </div>
);

export default SidebarHeader;