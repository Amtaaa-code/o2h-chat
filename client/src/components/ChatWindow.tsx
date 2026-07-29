"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Smile,
  Paperclip,
  Mic,
  Phone,
  Video,
  MoreVertical,
  Search,
  ArrowLeft,
  Reply,
  Forward,
  Trash2,
  Edit3,
  Copy,
  Pin,
  Download,
  Image as ImageIcon,
  FileText,
  MapPin,
  UserPlus,
  Play,
  Pause,
  Check,
  CheckCheck,
  X,
  ChevronUp,
  ListChecks,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/lib/store";
import { cn, formatTime, formatDate, formatFileSize, getUploadUrl } from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket";
import { useCall, CallScreen, IncomingCallDialog } from "@/components/CallComponents";
import api from "@/lib/axios";

interface Message {
  id: number;
  senderId: number;
  chatType?: string;
  chatId?: string;
  content: string | null;
  type: string;
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  sender: { id: number; username: string; avatar: string | null; profile?: { fullName: string } | null };
  attachments?: Array<{ id: number; filename: string; originalName: string; mimeType: string; size: number; url: string }>;
  reactions?: Array<{ id: number; emoji: string; user: { id: number; username: string } }>;
  reads?: Array<{ userId: number; readAt: string }>;
  replyTo?: Message;
}

interface PendingFile {
  file: File;
  preview?: string;
}

const EMOJI_CATEGORIES = [
  { label: "Smileys", emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨"] },
  { label: "Gestures", emojis: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤝", "🙏", "💪", "🦾", "🖕", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝"] },
  { label: "Hearts", emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "🫶", "💑", "💏"] },
  { label: "Objects", emojis: ["🔥", "💯", "✨", "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "⭐", "🌟", "💫", "🌈", "☀️", "🌙", "⚡", "💧", "🎯", "🎵", "🎶", "🎸", "🎹", "🥁", "🎺", "🎷"] },
];

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export default function ChatWindow() {
  const {
    activeChat, user, messages, setMessages, addMessage,
    profilePanelOpen, setProfilePanelOpen, setActiveChat,
  } = useAppStore();
  const { sendMessage, startTyping, stopTyping, markAsRead, emitSocket } = useSocket();
  const {
    callState, incomingCall,
    initiateCall, acceptCall, rejectCall, endCall,
    toggleMute, toggleVideo, toggleSpeaker,
  } = useCall();

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ msg: Message; x: number; y: number } | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeChat) {
      fetchMessages();
      setSelectedMessage(null);
      setReplyTo(null);
      setShowEmojiPicker(false);
      setShowAttachMenu(false);
      setPendingFiles([]);
    }
  }, [activeChat?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => scrollToBottom(), 100);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollDown(scrollHeight - scrollTop - clientHeight > 200);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchMessages = async () => {
    if (!activeChat) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/messages/${activeChat.type}/${activeChat.id}`);
      if (data.success) setMessages(data.data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // File selection handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: PendingFile[] = Array.from(files).map((file) => {
      const pending: PendingFile = { file };
      if (file.type.startsWith("image/")) {
        pending.preview = URL.createObjectURL(file);
      }
      return pending;
    });

    setPendingFiles((prev) => [...prev, ...newFiles]);
    setShowAttachMenu(false);
    e.target.value = "";
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => {
      const removed = prev[index];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Upload files and send message
  const handleSendWithFiles = async () => {
    if (pendingFiles.length === 0) return;
    if (!activeChat || !user) return;

    const savedInput = inputValue;
    const savedFiles = [...pendingFiles];
    setUploading(true);
    setInputValue("");
    setPendingFiles([]);
    setReplyTo(null);

    try {
      const formData = new FormData();
      savedFiles.forEach((pf) => formData.append("files", pf.file));

      const { data: uploadData } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (uploadData.success) {
        const files = uploadData.data;
        const hasImages = files.some((f: any) => f.mimeType.startsWith("image/"));

        const { data: msgRes } = await api.post("/messages", {
          chatType: activeChat.type,
          chatId: activeChat.id,
          content: savedInput.trim() || null,
          type: hasImages ? "IMAGE" : "DOCUMENT",
          replyToId: replyTo?.id,
          attachments: files,
        });

        if (msgRes.success) {
          const msg = {
            ...msgRes.data,
            sender: { id: user.id, username: user.username, avatar: user.avatar, profile: user.profile },
          };
          addMessage(msg as any);
          emitSocket("message:delivered", msg);
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setInputValue(savedInput);
      setPendingFiles(savedFiles);
    } finally {
      setUploading(false);
      inputRef.current?.focus();
    }
  };

  // Send text message
  const handleSend = async () => {
    if (pendingFiles.length > 0) {
      return handleSendWithFiles();
    }

    if (!inputValue.trim() || !activeChat || !user) return;

    const content = inputValue.trim();
    setInputValue("");
    setReplyTo(null);
    stopTyping(activeChat.type, activeChat.id);
    setIsTyping(false);
    inputRef.current?.focus();

    try {
      const { data } = await api.post("/messages", {
        chatType: activeChat.type,
        chatId: activeChat.id,
        content,
        type: "TEXT",
        replyToId: replyTo?.id,
      });

      if (data.success) {
        const msg = {
          ...data.data,
          sender: { id: user.id, username: user.username, avatar: user.avatar, profile: user.profile },
        };
        addMessage(msg as any);
        emitSocket("message:delivered", msg);
      }
    } catch (error) {
      console.error("Send message failed:", error);
      setInputValue(content);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (activeChat && !isTyping) {
      setIsTyping(true);
      startTyping(activeChat.type, activeChat.id);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (activeChat) {
        stopTyping(activeChat.type, activeChat.id);
        setIsTyping(false);
      }
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReaction = (messageId: number, emoji: string) => {
    emitSocket("message:reaction", { messageId, emoji });
    setContextMenu(null);
    setSelectedMessage(null);
  };

  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    setContextMenu({ msg, x: e.clientX, y: e.clientY });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setContextMenu(null);
    setSelectedMessage(null);
  };

  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setSelectedMessage(null);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // ---- CALL SCREEN ----
  if (callState.isActive) {
    return (
      <CallScreen
        callState={callState}
        onEndCall={endCall}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleSpeaker={toggleSpeaker}
      />
    );
  }

  // ---- INCOMING CALL DIALOG ----
  const incomingCallDialog = incomingCall ? (
    <IncomingCallDialog
      callerName={incomingCall.callerName}
      callerAvatar={incomingCall.callerAvatar}
      callType={incomingCall.callType}
      callId={incomingCall.callId}
      callerId={incomingCall.callerId}
      onAccept={acceptCall}
      onReject={rejectCall}
    />
  ) : null;

  // ---- EMPTY STATE ----
  if (!activeChat) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#060B16]">
        {incomingCallDialog}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-28 h-28 gradient-primary rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
            <span className="text-4xl font-bold text-white">O2H</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to O2H</h2>
          <p className="text-white/40 max-w-sm leading-relaxed">
            Select a conversation from the sidebar to start messaging, or create
            a new chat or group.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#060B16]">
      {incomingCallDialog}

      {/* Chat Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#1B2434] bg-[#0B1220]/80 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="md:hidden text-white/60 hover:text-white h-9 w-9" onClick={() => setActiveChat(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={activeChat.avatar || undefined} />
            <AvatarFallback name={activeChat.name} />
          </Avatar>
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate">{activeChat.name}</h3>
            <p className="text-xs text-white/40">
              {activeChat.isTyping ? (
                <span className="text-primary animate-pulse">typing...</span>
              ) : activeChat.type === "PRIVATE" ? (
                activeChat.isOnline ? <span className="text-green-400">Online</span> : "Offline"
              ) : (
                `${activeChat.memberCount || 0} members`
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white h-10 w-10" onClick={() => {
            if (activeChat.type === "PRIVATE") {
              initiateCall(parseInt(activeChat.id), activeChat.name, activeChat.avatar, "VOICE");
            }
          }}>
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white h-10 w-10" onClick={() => {
            if (activeChat.type === "PRIVATE") {
              initiateCall(parseInt(activeChat.id), activeChat.name, activeChat.avatar, "VIDEO");
            }
          }}>
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white h-10 w-10">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className={cn("h-10 w-10", profilePanelOpen ? "text-primary" : "text-white/60 hover:text-white")} onClick={() => setProfilePanelOpen(!profilePanelOpen)}>
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-white/30">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-primary/50" />
              </div>
              <p className="text-white/40 font-medium">No messages yet</p>
              <p className="text-white/20 text-sm mt-1">Start the conversation!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl mx-auto">
            {messages.map((msg, index) => {
              const isOwn = msg.senderId === user?.id;
              const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.senderId !== msg.senderId || messages[index - 1]?.isDeleted);
              const showDate = index === 0 || formatDate(msg.createdAt) !== formatDate(messages[index - 1]?.createdAt);
              const isConsecutive = index > 0 && messages[index - 1]?.senderId === msg.senderId && !messages[index - 1]?.isDeleted && formatDate(msg.createdAt) === formatDate(messages[index - 1]?.createdAt);

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex items-center justify-center my-5">
                      <div className="px-4 py-1.5 bg-[#101826] rounded-full border border-[#1B2434]">
                        <span className="text-xs text-white/40 font-medium">{formatDate(msg.createdAt)}</span>
                      </div>
                    </div>
                  )}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={cn("flex gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
                    {!isOwn && (
                      <div className="w-8 flex-shrink-0">
                        {showAvatar ? (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.sender.avatar || undefined} />
                            <AvatarFallback name={msg.sender.profile?.fullName || msg.sender.username} className="text-xs" />
                          </Avatar>
                        ) : <div className="w-8" />}
                      </div>
                    )}
                    <div className={cn("max-w-[65%] min-w-[80px]", isOwn ? "items-end" : "items-start")}>
                      {!isOwn && showAvatar && (
                        <p className="text-xs text-primary/70 mb-1 ml-1 font-medium">{msg.sender.profile?.fullName || msg.sender.username}</p>
                      )}

                      {msg.replyTo && (
                        <div className={cn("mb-1 px-3 py-2 border-l-2 border-primary/50 rounded-lg", isOwn ? "bg-primary/20" : "bg-[#1B2434]")}>
                          <p className="text-xs text-primary font-medium">{msg.replyTo.sender.username}</p>
                          <p className="text-xs text-white/40 truncate mt-0.5">{msg.replyTo.content || "Attachment"}</p>
                        </div>
                      )}

                      <div
                        className={cn("relative px-3 py-2 group", isOwn ? "message-own" : "message-other", isConsecutive && isOwn && "rounded-tr-2xl", isConsecutive && !isOwn && "rounded-tl-2xl")}
                        onClick={(e) => { e.stopPropagation(); setSelectedMessage(selectedMessage === msg.id ? null : msg.id); }}
                        onContextMenu={(e) => handleContextMenu(e, msg)}
                      >
                        {msg.isDeleted ? (
                          <p className="text-sm italic text-white/40 flex items-center gap-1.5"><Trash2 className="h-3.5 w-3.5" /> This message was deleted</p>
                        ) : msg.type === "IMAGE" && msg.attachments?.[0] ? (
                          <div>
                            <img
                              src={getUploadUrl(msg.attachments[0].url)}
                              alt={msg.attachments[0].originalName || "Image"}
                              className="rounded-xl max-w-[280px] max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              loading="lazy"
                              onClick={() => setLightboxImage(getUploadUrl(msg.attachments![0].url))}
                            />
                            {msg.content && <p className="mt-2 text-sm">{msg.content}</p>}
                          </div>
                        ) : msg.type === "DOCUMENT" && msg.attachments?.[0] ? (
                          <a href={getUploadUrl(msg.attachments[0].url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white/10 rounded-xl min-w-[200px] hover:bg-white/15 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{msg.attachments[0].originalName}</p>
                              <p className="text-xs text-white/50">{formatFileSize(msg.attachments[0].size)}</p>
                            </div>
                            <Download className="h-4 w-4 text-white/40 flex-shrink-0" />
                          </a>
                        ) : (
                          <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        )}

                        <AnimatePresence>
                          {selectedMessage === msg.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8, y: 8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8, y: 8 }}
                              className={cn("absolute -bottom-11 flex gap-0.5 bg-[#101826] rounded-full px-2 py-1.5 shadow-2xl border border-[#1B2434] z-30", isOwn ? "right-0" : "left-0")}
                            >
                              {QUICK_REACTIONS.map((emoji) => (
                                <button key={emoji} className="text-lg hover:scale-125 transition-transform p-0.5" onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, emoji); }}>{emoji}</button>
                              ))}
                              <button className="text-white/40 hover:text-white p-0.5 ml-1" onClick={(e) => { e.stopPropagation(); setContextMenu({ msg, x: e.clientX, y: e.clientY }); setSelectedMessage(null); }}>
                                <ChevronUp className="h-4 w-4" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className={cn("flex gap-1 mt-1", isOwn ? "justify-end" : "justify-start")}>
                          {Object.entries(msg.reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {} as Record<string, number>)).map(([emoji, count]) => (
                            <span key={emoji} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-[#101826] rounded-full text-xs border border-[#1B2434] hover:bg-[#1B2434] cursor-pointer transition-colors">
                              {emoji}{count > 1 && <span className="text-white/50">{count}</span>}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className={cn("flex items-center gap-1.5 mt-0.5 px-1", isOwn ? "justify-end" : "justify-start")}>
                        <span className="text-[10px] text-white/25">{formatTime(msg.createdAt)}</span>
                        {isOwn && (msg.reads && msg.reads.length > 0 ? <CheckCheck className="h-3.5 w-3.5 text-primary" /> : <Check className="h-3.5 w-3.5 text-white/25" />)}
                        {msg.isEdited && <span className="text-[10px] text-white/25 italic">edited</span>}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Scroll to bottom */}
      <AnimatePresence>
        {showScrollDown && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="absolute bottom-24 right-6 z-20">
            <Button onClick={scrollToBottom} size="icon" className="h-10 w-10 rounded-full bg-[#101826] border border-[#1B2434] shadow-xl hover:bg-[#1B2434] text-white/60 hover:text-white">
              <ChevronUp className="h-5 w-5 rotate-180" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending files preview */}
      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 bg-[#101826] border-t border-[#1B2434]"
          >
            <div className="flex gap-2 py-3 max-w-3xl mx-auto overflow-x-auto scrollbar-thin">
              {pendingFiles.map((pf, i) => (
                <div key={i} className="relative flex-shrink-0 group">
                  {pf.preview ? (
                    <img src={pf.preview} alt="" className="h-20 w-20 rounded-xl object-cover border border-[#1B2434]" />
                  ) : (
                    <div className="h-20 w-20 rounded-xl bg-primary/10 border border-[#1B2434] flex flex-col items-center justify-center gap-1 p-2">
                      <FileText className="h-6 w-6 text-primary" />
                      <span className="text-[9px] text-white/40 text-center truncate w-full">{pf.file.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => removePendingFile(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                  <span className="absolute bottom-1 right-1 text-[9px] text-white/40 bg-black/50 rounded px-1">{formatFileSize(pf.file.size)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply Preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 bg-[#101826] border-t border-[#1B2434]">
            <div className="flex items-center gap-3 py-2.5 max-w-3xl mx-auto">
              <div className="w-1 h-10 bg-primary rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-primary font-medium">{replyTo.sender.profile?.fullName || replyTo.sender.username}</p>
                <p className="text-xs text-white/50 truncate mt-0.5">{replyTo.content || "Attachment"}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-white/30 hover:text-white flex-shrink-0"><X className="h-4 w-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <div className="px-4 py-3 border-t border-[#1B2434] bg-[#0B1220]/80 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          {/* Attachment */}
          <div className="relative">
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white h-10 w-10" onClick={() => setShowAttachMenu(!showAttachMenu)}>
              <Paperclip className="h-5 w-5" />
            </Button>
            <AnimatePresence>
              {showAttachMenu && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute bottom-full left-0 mb-2 bg-[#101826] border border-[#1B2434] rounded-2xl p-3 shadow-2xl z-30 w-[240px]">
                  <p className="text-xs text-white/40 font-medium mb-2 px-1">Attach</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: ImageIcon, label: "Photo", color: "text-blue-400", bg: "bg-blue-400/10", accept: "image/*" },
                      { icon: FileText, label: "Document", color: "text-purple-400", bg: "bg-purple-400/10", accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" },
                      { icon: MapPin, label: "Location", color: "text-green-400", bg: "bg-green-400/10", accept: undefined },
                      { icon: UserPlus, label: "Contact", color: "text-orange-400", bg: "bg-orange-400/10", accept: undefined },
                      { icon: ListChecks, label: "Poll", color: "text-pink-400", bg: "bg-pink-400/10", accept: undefined },
                      { icon: Mic, label: "Voice", color: "text-red-400", bg: "bg-red-400/10", accept: undefined },
                    ].map((item) => (
                      <button key={item.label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/5 transition-colors"
                        onClick={() => {
                          setShowAttachMenu(false);
                          if (item.label === "Photo" && fileInputRef.current) {
                            fileInputRef.current.accept = "image/*";
                            fileInputRef.current.click();
                          } else if (item.label === "Document" && docInputRef.current) {
                            docInputRef.current.click();
                          }
                        }}>
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.bg)}>
                          <item.icon className={cn("h-5 w-5", item.color)} />
                        </div>
                        <span className="text-[11px] text-white/50">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input */}
          <div className="relative flex-1">
            <Input ref={inputRef} placeholder="Type a message..." value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown}
              className="h-11 bg-[#101826] border-[#1B2434] rounded-xl pr-10 text-[14px]" />
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 text-white/40 hover:text-white h-9 w-9" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              <Smile className="h-5 w-5" />
            </Button>
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-2 bg-[#101826] border border-[#1B2434] rounded-2xl shadow-2xl z-30 w-[320px]">
                  <div className="flex border-b border-[#1B2434] px-2 pt-2">
                    {EMOJI_CATEGORIES.map((cat, i) => (
                      <button key={cat.label} className={cn("flex-1 py-2 text-xs font-medium rounded-t-lg transition-colors", emojiCategory === i ? "text-primary border-b-2 border-primary" : "text-white/40 hover:text-white")} onClick={() => setEmojiCategory(i)}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-2 max-h-[200px] overflow-y-auto scrollbar-thin">
                    <div className="grid grid-cols-8 gap-0.5">
                      {EMOJI_CATEGORIES[emojiCategory].emojis.map((emoji) => (
                        <button key={emoji} className="text-xl p-1.5 rounded-lg hover:bg-white/10 transition-colors" onClick={() => { setInputValue(inputValue + emoji); setShowEmojiPicker(false); inputRef.current?.focus(); }}>{emoji}</button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Voice / Send */}
          {inputValue.trim() || pendingFiles.length > 0 ? (
            <Button onClick={handleSend} disabled={uploading} className="h-11 w-11 rounded-xl gradient-primary shadow-lg shadow-primary/25 flex-shrink-0" size="icon">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white h-11 w-11 flex-shrink-0">
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 bg-[#101826] border border-[#1B2434] rounded-2xl p-1.5 shadow-2xl min-w-[200px]"
            style={{ left: Math.min(contextMenu.x, window.innerWidth - 220), top: Math.min(contextMenu.y, window.innerHeight - 300) }}>
            <div className="flex gap-1 px-2 py-1.5 border-b border-[#1B2434] mb-1">
              {QUICK_REACTIONS.map((emoji) => (
                <button key={emoji} className="text-lg hover:scale-125 transition-transform p-0.5" onClick={() => handleReaction(contextMenu.msg.id, emoji)}>{emoji}</button>
              ))}
            </div>
            {[
              { icon: Reply, label: "Reply", action: () => { setReplyTo(contextMenu.msg); setContextMenu(null); inputRef.current?.focus(); } },
              ...(contextMenu.msg.content ? [{ icon: Copy, label: "Copy", action: () => handleCopy(contextMenu.msg.content!) }] : []),
              { icon: Forward, label: "Forward", action: () => setContextMenu(null) },
              { icon: Pin, label: contextMenu.msg.isPinned ? "Unpin" : "Pin", action: () => setContextMenu(null) },
              ...(contextMenu.msg.senderId === user?.id ? [{ icon: Edit3, label: "Edit", action: () => setContextMenu(null) }] : []),
              { icon: Trash2, label: "Delete", danger: true, action: () => { emitSocket("message:delete", { messageId: contextMenu.msg.id }); setContextMenu(null); } },
            ].map((item) => (
              <button key={item.label} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors", item.danger ? "text-red-400 hover:bg-red-400/10" : "text-white/70 hover:bg-white/5")} onClick={item.action}>
                <item.icon className="h-4 w-4" /><span>{item.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
      <input ref={docInputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" className="hidden" onChange={handleFileSelect} />

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setLightboxImage(null)}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={lightboxImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
              onClick={() => setLightboxImage(null)}
            >
              <X className="h-6 w-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
