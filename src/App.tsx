// src/App.tsx

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import AuthWrapper from "./components/AuthWrapper";
import AISearch from "./pages/AISearch";
import Sidebar from "./components/Sidebar/Sidebar";
import Navbar from "./components/Navbar";
import Library from "./pages/Library";
import { ThreadProvider, useThreadNavigation } from "./contexts/ThreadContext";
import { ChatProvider } from "./contexts/ChatContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import Chat from "./pages/Chat";

// Redirect component that uses the thread navigation hook
const SearchRedirect = () => {
  const { getCurrentThreadPath } = useThreadNavigation();
  return <Navigate to={getCurrentThreadPath()} replace />;
};

// Create a layout component that conditionally renders the sidebar
const AppLayout = ({ signOut }: { signOut: () => void }) => {
  const location = useLocation();
  const showSidebar =
    location.pathname === "/" || location.pathname.startsWith("/search");

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col">
      <Navbar signOut={signOut} />
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && <Sidebar />}
        <main
          className="flex-1 overflow-hidden"
        >
          <Routes>
            <Route path="/" element={<Navigate to="/search" replace />} />
            <Route path="/search" element={<SearchRedirect />} />
            <Route path="/search/:threadId" element={<AISearch />} />
            <Route path="/library" element={<Library />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:sourceId" element={<Chat />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthWrapper>
      {(signOut) => (
        <ThreadProvider>
            <ChatProvider>
              <SidebarProvider>
                <Router>
                  <AppLayout signOut={signOut} />
                </Router>
              </SidebarProvider>
            </ChatProvider>
        </ThreadProvider>
      )}
    </AuthWrapper>
  );
}

export default App;
