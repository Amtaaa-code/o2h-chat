"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ChevronLeft, ChevronRight, Camera, Send, Loader2, Trash2, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/lib/store";
import { cn, formatTime } from "@/lib/utils";
import api from "@/lib/axios";

interface StoryUser {
  user: { id: number; username: string; avatar: string | null; profile: { fullName: string } | null };
  stories: any[];
  hasUnviewed: boolean;
  latestCreatedAt: string;
}

// ========================
// Story Circles (ChatList top)
// ========================
export function StoryCircles({ onViewStory }: { onViewStory: (stories: any[], user: any, index: number) => void }) {
  const { user: currentUser } = useAppStore();
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStory, setShowAddStory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const { data } = await api.get("/status");
      if (data.success) setStoryUsers(data.data);
    } catch (error) {
      console.error("Failed to fetch stories:", error);
    } finally {
      setLoading(false);
    }
  };

  const myStory = storyUsers.find((s) => s.user.id === currentUser?.id);
  const otherStories = storyUsers.filter((s) => s.user.id !== currentUser?.id);

  if (loading) return null;

  return (
    <div className="relative">
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-thin px-4 py-3">
        {/* My Story / Add Story */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-1.5 flex-shrink-0"
          onClick={() => {
            if (myStory) {
              onViewStory(myStory.stories, myStory.user, 0);
            } else {
              setShowAddStory(true);
            }
          }}
        >
          <div className="relative">
            <Avatar className="h-14 w-14 border-2 border-[#1B2434]">
              <AvatarImage src={currentUser?.avatar || undefined} />
              <AvatarFallback name={currentUser?.profile?.fullName || currentUser?.username} />
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 gradient-primary rounded-full flex items-center justify-center border-2 border-[#0B1220]">
              <Plus className="h-3 w-3 text-white" />
            </div>
          </div>
          <span className="text-[10px] text-white/50 w-14 text-center truncate">
            {myStory ? "My Story" : "Add Story"}
          </span>
        </motion.button>

        {/* Other Users' Stories */}
        {otherStories.map((storyUser, idx) => (
          <motion.button
            key={storyUser.user.id}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
            onClick={() => onViewStory(storyUser.stories, storyUser.user, 0)}
          >
            <div
              className={cn(
                "p-[2px] rounded-full",
                storyUser.hasUnviewed
                  ? "bg-gradient-to-br from-yellow-400 via-red-500 to-purple-500"
                  : "bg-[#1B2434]"
              )}
            >
              <div className="p-[2px] rounded-full bg-[#0B1220]">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={storyUser.user.avatar || undefined} />
                  <AvatarFallback name={storyUser.user.profile?.fullName || storyUser.user.username} className="text-sm" />
                </Avatar>
              </div>
            </div>
            <span className="text-[10px] text-white/50 w-14 text-center truncate">
              {storyUser.user.profile?.fullName || storyUser.user.username}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Scroll arrows */}
      <button
        onClick={() => scrollRef.current?.scrollBy({ left: -100, behavior: "smooth" })}
        className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#101826] border border-[#1B2434] rounded-full flex items-center justify-center text-white/40 hover:text-white z-10"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => scrollRef.current?.scrollBy({ left: 100, behavior: "smooth" })}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#101826] border border-[#1B2434] rounded-full flex items-center justify-center text-white/40 hover:text-white z-10"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>

      {/* Add Story Dialog */}
      <AddStoryDialog
        open={showAddStory}
        onOpenChange={setShowAddStory}
        onCreated={() => {
          setShowAddStory(false);
          fetchStories();
        }}
      />
    </div>
  );
}

// ========================
// Story Viewer (Full screen)
// ========================
interface StoryViewerProps {
  stories: any[];
  user: { id: number; username: string; avatar: string | null; profile: { fullName: string } | null };
  startIndex: number;
  onClose: () => void;
  onStoryViewed: (statusId: number) => void;
}

export function StoryViewer({ stories, user, startIndex, onClose, onStoryViewed }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const STORY_DURATION = 5000; // 5 seconds per story

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setProgress(0);
    const interval = 50;
    const increment = (interval / STORY_DURATION) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goNext();
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    // Mark as viewed
    if (currentStory) {
      api.post(`/status/${currentStory.id}/view`).catch(() => {});
      onStoryViewed(currentStory.id);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPaused]); // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  if (!currentStory) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-3 pt-4">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden">
            <div
              className={cn("h-full bg-white rounded-full transition-all", i < currentIndex && "w-full")}
              style={{
                width: i === currentIndex ? `${progress}%` : i < currentIndex ? "100%" : "0%",
                transition: i === currentIndex ? "none" : undefined,
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center gap-3 p-3 pt-8">
        <Avatar className="h-9 w-9">
          <AvatarImage src={user.avatar || undefined} />
          <AvatarFallback name={user.profile?.fullName || user.username} />
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{user.profile?.fullName || user.username}</p>
          <p className="text-[10px] text-white/50">{formatTime(currentStory.createdAt)}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:text-white/80 h-9 w-9">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Touch/click zones */}
      <div className="absolute inset-0 z-20 flex">
        <button className="w-1/3 h-full" onClick={goPrev} onMouseDown={() => setIsPaused(true)} onMouseUp={() => setIsPaused(false)} onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)} />
        <button className="w-1/3 h-full" onMouseDown={() => setIsPaused(true)} onMouseUp={() => setIsPaused(false)} onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)} />
        <button className="w-1/3 h-full" onClick={goNext} onMouseDown={() => setIsPaused(true)} onMouseUp={() => setIsPaused(false)} onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)} />
      </div>

      {/* Story content */}
      <div className="relative w-full h-full flex items-center justify-center z-10">
        {currentStory.mediaUrl && currentStory.mediaType === "IMAGE" ? (
          <img src={currentStory.mediaUrl} alt="" className="w-full h-full object-contain" />
        ) : currentStory.mediaUrl && currentStory.mediaType === "VIDEO" ? (
          <video src={currentStory.mediaUrl} className="w-full h-full object-contain" autoPlay muted />
        ) : (
          <div className="w-full h-full flex items-center justify-center px-12">
            <div
              className="w-full max-w-lg rounded-2xl p-8 text-center"
              style={{
                background: currentStory.content?.includes("#") ? "linear-gradient(135deg, #1E6BFF, #7C3AED)" : "linear-gradient(135deg, #101826, #1B2434)",
              }}
            >
              <p className="text-white text-xl font-medium leading-relaxed">{currentStory.content}</p>
            </div>
          </div>
        )}
      </div>

      {/* View count */}
      {currentStory.userId === useAppStore.getState().user?.id && (
        <div className="absolute bottom-6 left-0 right-0 z-30 flex items-center justify-center">
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
            <Eye className="h-3.5 w-3.5 text-white/70" />
            <span className="text-xs text-white/70">{currentStory.views?.length || 0} views</span>
          </div>
        </div>
      )}

      {/* Nav arrows */}
      {currentIndex > 0 && (
        <button onClick={goPrev} className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white/60 hover:text-white">
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {currentIndex < stories.length - 1 && (
        <button onClick={goNext} className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white/60 hover:text-white">
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </motion.div>
  );
}

// ========================
// Add Story Dialog
// ========================
function AddStoryDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [storyType, setStoryType] = useState<"text" | "image">("text");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setContent("");
      setSelectedFile(null);
      setPreview(null);
      setStoryType("text");
      setError("");
    }
  }, [open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setStoryType("image");
    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !selectedFile) return;
    setLoading(true);
    setError("");
    try {
      let mediaUrl = null;
      let mediaType = null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("files", selectedFile);
        const { data: uploadData } = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (uploadData.success && uploadData.data[0]) {
          mediaUrl = uploadData.data[0].url;
          mediaType = selectedFile.type.startsWith("video/") ? "VIDEO" : "IMAGE";
        } else {
          setError("Failed to upload file. Please try again.");
          setLoading(false);
          return;
        }
      }

      await api.post("/status", {
        content: storyType === "text" ? content.trim() : null,
        mediaUrl,
        mediaType,
        caption: content.trim() || null,
      });

      onCreated();
    } catch (error: any) {
      console.error("Failed to create story:", error);
      setError(error.response?.data?.message || "Failed to post story. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 bg-[#0B1220] flex flex-col"
      >
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#1B2434]">
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-white/60 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
          <h3 className="font-semibold text-white">New Story</h3>
          <Button
            onClick={handlePost}
            disabled={loading || (!content.trim() && !selectedFile)}
            className="gradient-primary h-9 rounded-xl text-sm"
            size="sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
          </Button>
        </div>

        {/* Type selector */}
        {error && (
          <div className="px-4 py-2">
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          </div>
        )}

        <div className="px-4 py-3 flex gap-2">
          <button
            onClick={() => setStoryType("text")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all",
              storyType === "text" ? "bg-primary text-white" : "bg-[#101826] text-white/50 hover:text-white"
            )}
          >
            Text Story
          </button>
          <button
            onClick={() => {
              setStoryType("image");
              fileInputRef.current?.click();
            }}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all",
              storyType === "image" ? "bg-primary text-white" : "bg-[#101826] text-white/50 hover:text-white"
            )}
          >
            Photo Story
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 flex items-center justify-center p-6">
          {storyType === "text" ? (
            <div className="w-full max-w-md">
              <div
                className="rounded-2xl p-8 min-h-[200px] flex items-center justify-center"
                style={{
                  background: content.includes("#")
                    ? "linear-gradient(135deg, #1E6BFF, #7C3AED)"
                    : "linear-gradient(135deg, #101826, #1B2434)",
                }}
              >
                <textarea
                  placeholder="What's on your mind?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-transparent text-white text-lg text-center placeholder-white/30 outline-none resize-none"
                  rows={4}
                  maxLength={500}
                />
              </div>
              <p className="text-xs text-white/30 text-center mt-3">{content.length}/500</p>
            </div>
          ) : (
            <div className="w-full max-w-md">
              {preview ? (
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={preview} alt="" className="w-full max-h-[400px] object-cover rounded-2xl" />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                      setStoryType("text");
                    }}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-[300px] rounded-2xl border-2 border-dashed border-[#1B2434] flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors"
                >
                  <Camera className="h-12 w-12 text-white/20" />
                  <p className="text-sm text-white/40">Tap to add a photo</p>
                </button>
              )}
              <Input
                placeholder="Add a caption..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-3 bg-[#101826] border-[#1B2434] h-11"
              />
            </div>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
      </motion.div>
    </AnimatePresence>
  );
}

export default StoryCircles;
