// src/components/Sidebar/SidebarFooter.tsx

import { getCurrentUser } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';

const FooterItem = ({ icon, text }: { icon: string; text: string }) => (
  <div className="flex items-center gap-3 p-2 px-4 hover:bg-accent rounded-lg cursor-pointer">
    <img src={icon} className="h-5 w-5" />
    <span className="text-sm">{text}</span>
  </div>
);

const SidebarFooter = ({ signOut }: { signOut: () => void }) => {
  const [user, setUser] = useState<{
    email?: string;
    username?: string;
    name?: string;
    uuid?: string;
  }>({});

  useEffect(() => {
    const getCurrentUserInfo = async () => {
      try {
        const userInfo = await getCurrentUser();
        setUser({
          email: userInfo.signInDetails?.loginId,
          username: userInfo.username,
          name: userInfo.signInDetails?.loginId,
          uuid: userInfo.userId
        });
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    getCurrentUserInfo();
  }, []);

  return (
    <div className="mt-auto p-2 space-y-1">
      <FooterItem
        icon="/support.svg"
        text="Support"
      />
      <FooterItem
        icon="/settings.svg"
        text="Settings"
      />
      <div className="mt-2 flex items-center justify-between p-3 bg-accent rounded-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src="/avatar-default.svg" alt="avatar" className="h-8 w-8 rounded-full" />
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.name || 'User'}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
        <img 
          src="/log-in-01.svg" 
          className="h-8 w-8 cursor-pointer hover:bg-accent-foreground/10 p-1.5 rounded-md transition-colors"
          onClick={signOut}
          alt="Sign out"
        />
      </div>
    </div>
  );
};

export default SidebarFooter;