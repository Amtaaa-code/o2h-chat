"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import ChatList from "@/components/ChatList";

export default function ChatPage() {
  const { activeChat, setActiveChat } = useAppStore();
  const router = useRouter();

  // On mobile, if a chat is active, show chat window
  // On desktop, the layout handles this

  return (
    <div className="h-full flex flex-col bg-[#060B16]">
      {!activeChat ? (
        <ChatList />
      ) : (
        <div className="h-full">
          {/* On mobile, when activeChat is selected, show empty state
              since the layout will render ChatWindow */}
          <div className="flex items-center justify-center h-full text-white/40 md:hidden">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-primary">O2H</span>
              </div>
              <p className="text-sm">Opening chat...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
