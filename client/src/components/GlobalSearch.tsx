"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, MessageSquare, User, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import api from "@/lib/axios";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { formatTime } from "@/lib/utils";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const { setActiveChat } = useAppStore();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "messages">("users");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setUsers([]);
      setMessages([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      setMessages([]);
      return;
    }
    const timer = setTimeout(() => {
      performSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const [usersRes, messagesRes] = await Promise.all([
        api.get(`/search?q=${encodeURIComponent(query)}&type=users`).catch(() => ({ data: { data: [] } })),
        api.get(`/search?q=${encodeURIComponent(query)}&type=messages`).catch(() => ({ data: { data: [] } })),
      ]);
      setUsers(usersRes.data?.data || []);
      setMessages(messagesRes.data?.data || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId: number, username: string) => {
    setActiveChat({
      id: String(userId),
      type: "PRIVATE",
      name: username,
      avatar: null,
      isOnline: false,
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
    });
    onOpenChange(false);
    router.push("/chat");
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#060B16] md:bg-black/60 md:backdrop-blur-sm flex flex-col md:items-center md:justify-start md:pt-20"
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-lg bg-[#0B1220] border border-[#1B2434] rounded-2xl shadow-2xl overflow-hidden md:mx-4"
        >
          {/* Search Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1B2434]">
            <Search className="h-5 w-5 text-white/40 flex-shrink-0" />
            <input
              ref={inputRef}
              placeholder="Search users, messages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
              onKeyDown={(e) => { if (e.key === 'Escape') onOpenChange(false); }}
            />
            {loading && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
            <button onClick={() => onOpenChange(false)} className="text-white/40 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#1B2434]">
            {(["users", "messages"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                  activeTab === tab ? "text-primary border-b-2 border-primary" : "text-white/40 hover:text-white/60"
                }`}
              >
                {tab} {tab === "users" ? `(${users.length})` : `(${messages.length})`}
              </button>
            ))}
          </div>

          {/* Results */}
          <ScrollArea className="max-h-[50vh]">
            {!query.trim() ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/30">
                <Search className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">Type to search...</p>
              </div>
            ) : activeTab === "users" ? (
              users.length === 0 ? (
                <div className="py-12 text-center text-white/30 text-sm">No users found</div>
              ) : (
                <div className="py-2">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                      onClick={() => handleUserClick(u.id, u.username)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={u.avatar || undefined} />
                        <AvatarFallback name={u.profile?.fullName || u.username} />
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-white truncate">{u.profile?.fullName || u.username}</p>
                        <p className="text-xs text-white/40">@{u.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : messages.length === 0 ? (
              <div className="py-12 text-center text-white/30 text-sm">No messages found</div>
            ) : (
              <div className="py-2">
                {messages.map((msg) => (
                  <div key={msg.id} className="px-4 py-3 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={msg.sender?.avatar || undefined} />
                        <AvatarFallback className="text-[9px]" name={msg.sender?.username} />
                      </Avatar>
                      <span className="text-xs font-medium text-white">{msg.sender?.username}</span>
                      <span className="text-[10px] text-white/30">{formatTime(msg.createdAt)}</span>
                    </div>
                    <p className="text-sm text-white/60 line-clamp-2">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
