"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useSocket } from "@/hooks/useSocket";
import Sidebar from "@/components/Sidebar";
import ChatList from "@/components/ChatList";
import ChatWindow from "@/components/ChatWindow";
import ProfilePanel from "@/components/ProfilePanel";
import MobileNav from "@/components/MobileNav";
import { StoryViewer } from "@/components/StoryComponents";
import api from "@/lib/axios";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, profilePanelOpen, sidebarCollapsed, activeChat, setActiveChat } = useAppStore();
  const [loading, setLoading] = useState(true);

  // Story viewer state
  const [storyViewerData, setStoryViewerData] = useState<{
    stories: any[];
    user: any;
    index: number;
  } | null>(null);

  useSocket();

  const isSubRoute = pathname !== "/chat";

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const { data } = await api.get("/users/me");
        if (data.success) {
          setUser(data.data);
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router, setUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060B16]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center animate-pulse-glow">
            <span className="text-2xl font-bold text-white">O2H</span>
          </div>
          <p className="text-white/60 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const handleViewStory = (stories: any[], user: any, index: number) => {
    setStoryViewerData({ stories, user, index });
  };

  const handleStoryViewed = (statusId: number) => {
    // Could refresh story circles here if needed
  };

  return (
    <div className="h-screen flex bg-[#060B16] overflow-hidden">
      {/* Desktop Layout */}
      <div className="hidden md:flex w-full h-full">
        <Sidebar />

        <div
          className={`${
            sidebarCollapsed ? "w-16" : "w-[340px]"
          } h-full border-r border-[#1B2434] flex-shrink-0 transition-all duration-300`}
        >
          <ChatList onViewStory={handleViewStory} />
        </div>

        <div className="flex-1 h-full min-w-0">
          {isSubRoute ? children : <ChatWindow />}
        </div>

        {profilePanelOpen && (
          <div className="w-[340px] h-full border-l border-[#1B2434] flex-shrink-0 animate-fade-in">
            <ProfilePanel />
          </div>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden w-full h-full flex flex-col">
        <div className="flex-1 overflow-hidden">
          {isSubRoute ? (
            children
          ) : activeChat ? (
            <ChatWindow />
          ) : (
            <ChatList onViewStory={handleViewStory} />
          )}
        </div>
        {!isSubRoute && !activeChat && <MobileNav />}
      </div>

      {/* Story Viewer Overlay */}
      <AnimatePresence>
        {storyViewerData && (
          <StoryViewer
            stories={storyViewerData.stories}
            user={storyViewerData.user}
            startIndex={storyViewerData.index}
            onClose={() => setStoryViewerData(null)}
            onStoryViewed={handleStoryViewed}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
