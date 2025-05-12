import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { cn } from "@/lib/utils";
import { UserPlus } from "lucide-react";
import { Button } from "./ui/button";

interface NavbarProps {
  signOut: () => void;
}

const Navbar = ({ signOut }: NavbarProps) => {
  const location = useLocation();
  const [user, setUser] = useState<{
    email?: string;
    username?: string;
    name?: string;
    uuid?: string;
  }>({});
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const getCurrentUserInfo = async () => {
      try {
        const userInfo = await getCurrentUser();
        setUser({
          email: userInfo.signInDetails?.loginId,
          username: userInfo.username,
          name: userInfo.signInDetails?.loginId,
          uuid: userInfo.userId,
        });
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    getCurrentUserInfo();
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".profile-dropdown") && isProfileOpen) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  const isActive = (path: string) => {
    if (path === "/search" && location.pathname.startsWith("/search")) {
      return true;
    }
    if (path === "/chat" && location.pathname.startsWith("/chat")) {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <header className="border-b bg-white">
      <div className="flex items-center h-12 gap-2">
        <Link to="/" className="flex items-center">
          <img src="/logo.svg" alt="Wayless" className="h-6 ml-4" />
          <h1 className="text-2xl pl-4 font-bold">Wayless</h1>
        </Link>

        <nav className="ml-12 lg:ml-24">
          <div className="flex gap-0">
              <Link
                to="/"
                className={cn(
                  "px-3 py-2 flex items-center text-sm font-medium transition-colors hover:bg-gray-100 rounded-sm",
                  (isActive("/") || isActive("/search")) && "text-blue-600"
                )}
              >
                Search
              </Link>
              <Link
                to="/library"
                className={cn(
                  "px-3 py-2 flex items-center text-sm font-medium transition-colors hover:bg-gray-100 rounded-sm",
                  isActive("/library") && "text-blue-600"
                )}
              >
                Library
              </Link>
              <Link
                to="/chat"
                className={cn(
                  "px-3 py-2 flex items-center text-sm font-medium transition-colors hover:bg-gray-100 rounded-sm",
                  isActive("/chat") && "text-blue-600"
                )}
              >
                Chat
              </Link>
            </div>
        </nav>

        <div className="ml-auto mr-4 flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              const subject = "AI powered PubMed search";
              const body =
                "Hey, I'd like to invite you to try Wayless, a platform for medical research.\n\nYou can find it here: https://wayless.ai\n\nYou can also schedule a chat with the cofounders to get a demo: https://cal.com/wayless/demo?user=wayless";
              window.location.href = `mailto:?subject=${encodeURIComponent(
                subject
              )}&body=${encodeURIComponent(body)}`;
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 rounded-md transition-colors"
            aria-label="Invite colleague"
          >
            <UserPlus className="h-4 w-4" />
            Invite
          </Button>

          <div className="relative profile-dropdown">
            <Button
              size="icon"
              variant="default"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center justify-center h-8 w-8 rounded-full transition-colors"
              aria-label="User profile"
            >
              {user.name ? (
                <span className="text-xs font-medium">
                  {user.name
                    .split(" ")
                    .map((name) => name[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </span>
              ) : (
                <img
                  src="/avatar-default.svg"
                  alt="avatar"
                  className="h-6 w-6 rounded-full"
                />
              )}
            </Button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 border">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-slate-800 text-white">
                      {user.name ? (
                        <span className="text-lg font-medium">
                          {user.name
                            .split(" ")
                            .map((name) => name[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </span>
                      ) : (
                        <img
                          src="/avatar-default.svg"
                          alt="avatar"
                          className="h-10 w-10 rounded-full"
                        />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name || "User"}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <Button
                    variant="ghost"
                    onClick={signOut}
                    className="flex items-center justify-between w-full"
                  >
                    <div className="flex flex-row gap-2 items-center">
                      <img
                        src="/log-in-01.svg"
                        className="h-4 w-4 pt-0.5"
                        alt="Sign out"
                      />
                      Sign Out
                    </div>
                    <div></div>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
