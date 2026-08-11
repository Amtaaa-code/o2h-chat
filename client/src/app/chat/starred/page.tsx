"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, ArrowLeft, MessageSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

interface StarredMessage {
  id: number;
  content: string | null;
  type: string;
  createdAt: string;
  isStarred: boolean;
  sender: { id: number; username: string; avatar: string | null };
  chatType: string;
  chatId: string;
}

export default function StarredMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<StarredMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStarred();
  }, []);

  const fetchStarred = async () => {
    try {
      const { data } = await api.get("/messages/starred");
      setMessages(data.data || []);
    } catch (error) {
      console.error("Failed to fetch starred messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstar = async (id: number) => {
    try {
      await api.post(`/messages/${id}/star`);
      setMessages((msgs) => msgs.filter((m) => m.id !== id));
    } catch (error) {
      console.error("Unstar failed:", error);
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  return (
    <div className="flex flex-col h-full bg-[#060B16]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1B2434] bg-[#0B1220]">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white/60 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Star className="h-5 w-5 text-yellow-400" />
        <h1 className="text-lg font-semibold text-white">Starred Messages</h1>
        <span className="text-sm text-white/40 ml-auto">{messages.length} messages</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-white/40">
            <Star className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">No starred messages yet</p>
            <p className="text-xs mt-1">Long-press a message and tap Star to save it here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#101826] border border-[#1B2434] rounded-xl p-3 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={msg.sender.avatar || undefined} />
                    <AvatarFallback name={msg.sender.username} />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{msg.sender.username}</span>
                      <span className="text-xs text-white/30">{formatTime(msg.createdAt)}</span>
                      <span className="text-xs text-white/20">
                        {msg.chatType === "GROUP" ? "Group" : "Private"}
                      </span>
                    </div>
                    <p className="text-sm text-white/70 truncate">{msg.content || `[${msg.type}]`}</p>
                  </div>
                  <button
                    onClick={() => handleUnstar(msg.id)}
                    className="text-yellow-400 hover:text-yellow-300 p-1"
                  >
                    <Star className="h-4 w-4 fill-current" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
