"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  MessageCircle,
  Users,
  Pin,
  Volume2,
  VolumeX,
  MoreVertical,
  Trash2,
  Bell,
  BellOff,
  Archive,
  UserPlus,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/lib/store";
import { cn, formatDate, truncate } from "@/lib/utils";
import api from "@/lib/axios";
import CreateGroupDialog from "./CreateGroupDialog";
import { StoryCircles } from "./StoryComponents";

interface ChatItem {
  id: string;
  type: "PRIVATE" | "GROUP";
  name: string;
  avatar: string | null;
  lastMessage?: { content: string; createdAt: string; sender: { username: string } };
  unreadCount: number;
  isOnline?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  memberCount?: number;
}

export default function ChatList({ onViewStory }: { onViewStory?: (stories: any[], user: any, index: number) => void }) {
  const { activeChat, setActiveChat, searchQuery, setSearchQuery, user } = useAppStore();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "groups">("all");
  const [contextMenu, setContextMenu] = useState<{ chatId: string; x: number; y: number } | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    let filtered = chats;
    if (searchQuery) {
      filtered = chats.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeTab === "unread") {
      filtered = filtered.filter((c) => c.unreadCount > 0);
    } else if (activeTab === "groups") {
      filtered = filtered.filter((c) => c.type === "GROUP");
    }
    setFilteredChats(filtered);
  }, [chats, searchQuery, activeTab]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const fetchChats = async () => {
    try {
      const [conversationsRes, groupsRes] = await Promise.all([
        api.get("/messages/conversations").catch(() => ({ data: { data: [] } })),
        api.get("/groups").catch(() => ({ data: { data: [] } })),
      ]);

      const privateChats: ChatItem[] = (conversationsRes.data?.data || []).map(
        (c: any) => ({
          id: c.id,
          type: c.type as "PRIVATE" | "GROUP",
          name: c.name,
          avatar: c.avatar,
          lastMessage: c.lastMessage,
          unreadCount: c.unreadCount || 0,
          isOnline: c.isOnline,
          isPinned: c.isPinned,
          isMuted: c.isMuted,
        })
      );

      const groupChats: ChatItem[] = (groupsRes.data?.data || []).map(
        (g: any) => ({
          id: String(g.id),
          type: "GROUP" as const,
          name: g.name,
          avatar: g.avatar,
          lastMessage: g.lastMessage,
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          memberCount: g.members?.length || 0,
        })
      );

      const allChats = [...privateChats, ...groupChats];
      const pinned = allChats.filter((c) => c.isPinned);
      const unpinned = allChats.filter((c) => !c.isPinned);
      setChats([...pinned, ...unpinned]);
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time chat list updates
  useEffect(() => {
    let mounted = true;
    const loadSocket = async () => {
      const { onSocket, offSocket } = await import('@/lib/socket');
      const handleMessageNew = (message: any) => {
        if (!mounted) return;
        setChats((prev) => {
          const chatUserId = message.chatType === 'PRIVATE'
            ? (String(message.senderId) === String(message.chatId) ? message.chatId : String(message.senderId))
            : null;
          const chatId = message.chatType === 'GROUP' ? String(message.chatId) : chatUserId;
          if (!chatId) return prev;
          const existing = prev.find((c) => c.id === chatId);
          const isOwn = message.senderId === user?.id;
          if (existing) {
            const updated = prev.map((c) =>
              c.id === chatId
                ? {
                    ...c,
                    lastMessage: {
                      content: message.content || '📎 Attachment',
                      createdAt: message.createdAt,
                      sender: message.sender,
                    },
                    unreadCount: isOwn ? c.unreadCount : c.unreadCount + 1,
                  }
                : c
            );
            const chat = updated.find((c) => c.id === chatId)!;
            const rest = updated.filter((c) => c.id !== chatId);
            return [chat, ...rest];
          }
          return prev;
        });
      };
      onSocket('message:new', handleMessageNew);
      return () => { offSocket('message:new', handleMessageNew); };
    };
    loadSocket();
    return () => { mounted = false; };
  }, [user]);

  const handleContextMenu = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    setContextMenu({ chatId, x: e.clientX, y: e.clientY });
  };

  const handlePin = async (chatId: string) => {
    setContextMenu(null);
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;
    try {
      if (chat.type === "PRIVATE") {
        await api.put(`/contacts/${chatId}/pin`);
      }
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, isPinned: !c.isPinned } : c))
      );
    } catch (error) {
      console.error("Failed to pin chat:", error);
    }
  };

  const handleMute = async (chatId: string) => {
    setContextMenu(null);
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;
    try {
      if (chat.type === "PRIVATE") {
        await api.put(`/contacts/${chatId}/mute`);
      }
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, isMuted: !c.isMuted } : c))
      );
    } catch (error) {
      console.error("Failed to mute chat:", error);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    setContextMenu(null);
    if (!confirm("Are you sure you want to delete this chat?")) return;
    try {
      if (activeChat?.id === chatId) setActiveChat(null);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const tabs = [
    { id: "all" as const, label: "All" },
    { id: "unread" as const, label: "Unread" },
    { id: "groups" as const, label: "Groups" },
  ];

  return (
    <div className="h-full flex flex-col bg-[#0B1220]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Chats</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white h-9 w-9"
            onClick={() => setShowCreateGroup(true)}
          >
            <Users className="h-4.5 w-4.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white h-9 w-9"
            onClick={() => setShowNewChat(true)}
          >
            <Plus className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-10 bg-[#101826] border-[#1B2434] rounded-xl text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-2 flex gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
              activeTab === tab.id
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-[#101826] text-white/50 hover:text-white hover:bg-[#1B2434]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stories */}
      {onViewStory && <StoryCircles onViewStory={onViewStory} />}

      {/* Chat List */}
      <ScrollArea className="flex-1 px-2">
        <AnimatePresence>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-primary/50" />
              </div>
              <p className="text-white/40 text-sm font-medium">
                {searchQuery ? "No chats found" : "No conversations yet"}
              </p>
              <p className="text-white/30 text-xs mt-1">
                {searchQuery
                  ? "Try a different search term"
                  : "Start a new chat to begin messaging"}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredChats.map((chat) => {
                const isActiveChat = activeChat?.id === chat.id;
                return (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn("chat-item", isActiveChat && "active")}
                    onClick={() => setActiveChat(chat)}
                    onContextMenu={(e) => handleContextMenu(e, chat.id)}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={chat.avatar || undefined} />
                        <AvatarFallback name={chat.name} />
                      </Avatar>
                      {chat.type === "PRIVATE" && chat.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0B1220] shadow-sm" />
                      )}
                      {chat.type === "GROUP" && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full border-2 border-[#0B1220] flex items-center justify-center shadow-sm">
                          <Users className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {chat.isPinned && (
                            <Pin className="h-3 w-3 text-white/30 flex-shrink-0 rotate-45" />
                          )}
                          <span
                            className={cn(
                              "font-medium truncate",
                              chat.unreadCount > 0 ? "text-white" : "text-white/90"
                            )}
                          >
                            {chat.name}
                          </span>
                        </div>
                        {chat.lastMessage && (
                          <span
                            className={cn(
                              "text-[11px] flex-shrink-0 ml-2",
                              chat.unreadCount > 0 ? "text-primary font-medium" : "text-white/30"
                            )}
                          >
                            {formatDate(chat.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p
                          className={cn(
                            "text-[13px] truncate",
                            chat.unreadCount > 0 ? "text-white/70" : "text-white/40"
                          )}
                        >
                          {chat.lastMessage
                            ? chat.type === "GROUP"
                              ? `${chat.lastMessage.sender.username}: ${chat.lastMessage.content || "📎 Attachment"}`
                              : truncate(chat.lastMessage.content || "📎 Attachment", 35)
                            : "Start a conversation"}
                        </p>
                        <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                          {chat.isMuted && (
                            <VolumeX className="h-3.5 w-3.5 text-white/20" />
                          )}
                          {chat.unreadCount > 0 && (
                            <span className="unread-badge">
                              {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 bg-[#101826] border border-[#1B2434] rounded-2xl p-1.5 shadow-2xl min-w-[180px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {[
              { icon: Pin, label: contextMenu && chats.find(c => c.id === contextMenu.chatId)?.isPinned ? "Unpin chat" : "Pin chat", action: () => handlePin(contextMenu.chatId) },
              { icon: Bell, label: contextMenu && chats.find(c => c.id === contextMenu.chatId)?.isMuted ? "Unmute" : "Mute", action: () => handleMute(contextMenu.chatId) },
              { icon: Archive, label: "Archive", action: () => setContextMenu(null) },
              { icon: Trash2, label: "Delete chat", danger: true, action: () => handleDeleteChat(contextMenu.chatId) },
            ].map((item) => (
              <button
                key={item.label}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                  item.danger
                    ? "text-red-400 hover:bg-red-400/10"
                    : "text-white/70 hover:bg-white/5"
                )}
                onClick={item.action}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Chat Dialog */}
      <AnimatePresence>
        {showNewChat && (
          <NewChatDialog onClose={() => setShowNewChat(false)} />
        )}
      </AnimatePresence>

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
      />
    </div>
  );
}

function NewChatDialog({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get("/users");
        if (data.success) setUsers(data.data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.profile?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-[#0B1220] flex flex-col"
    >
      <div className="h-16 px-4 flex items-center gap-3 border-b border-[#1B2434]">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white/60 hover:text-white">
          <X className="h-5 w-5" />
        </Button>
        <h3 className="font-semibold text-white">New Chat</h3>
      </div>

      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-[#101826] border-[#1B2434]"
            autoFocus
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/40 text-sm">No users found</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((user) => (
              <motion.div
                key={user.id}
                whileHover={{ x: 2 }}
                className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => {
                  useAppStore.getState().setActiveChat({
                    id: String(user.id),
                    type: "PRIVATE",
                    name: user.profile?.fullName || user.username,
                    avatar: user.avatar,
                    unreadCount: 0,
                    isOnline: user.isOnline,
                  });
                  onClose();
                }}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback name={user.profile?.fullName || user.username} />
                  </Avatar>
                  {user.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0B1220]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {user.profile?.fullName || user.username}
                  </p>
                  <p className="text-sm text-white/40 truncate">@{user.username}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
}
