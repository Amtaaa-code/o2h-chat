"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Phone,
  Video,
  Bell,
  BellOff,
  ImageIcon,
  FileText,
  Link,
  Shield,
  HardDrive,
  Star,
  Trash2,
  Ban,
  ChevronRight,
  Lock,
  Info,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function ProfilePanel() {
  const { activeChat, setProfilePanelOpen } = useAppStore();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  if (!activeChat) return null;

  const sections = [
    {
      icon: ImageIcon,
      label: "Media, Links, and Docs",
      count: 24,
      id: "media",
    },
    {
      icon: FileText,
      label: "Documents",
      count: 12,
      id: "docs",
    },
    {
      icon: Link,
      label: "Shared Links",
      count: 8,
      id: "links",
    },
  ];

  const mediaItems = [
    { type: "image", url: null, label: "Photo 1" },
    { type: "image", url: null, label: "Photo 2" },
    { type: "video", url: null, label: "Video 1" },
    { type: "doc", url: null, label: "Document.pdf" },
  ];

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      className="h-full flex flex-col bg-[#0B1220]"
    >
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#1B2434] flex-shrink-0">
        <h3 className="font-semibold text-white">Contact Info</h3>
        <Button
          variant="ghost"
          size="icon"
          className="text-white/60 hover:text-white h-9 w-9"
          onClick={() => setProfilePanelOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {/* Profile */}
        <div className="flex flex-col items-center py-6 px-4">
          <Avatar className="h-28 w-28 mb-3">
            <AvatarImage src={activeChat.avatar || undefined} />
            <AvatarFallback name={activeChat.name} className="text-3xl" />
          </Avatar>
          <h3 className="text-lg font-bold text-white">{activeChat.name}</h3>
          <p className="text-sm text-white/40 mt-0.5">
            {activeChat.type === "PRIVATE"
              ? activeChat.isOnline
                ? "Online"
                : "Last seen recently"
              : `${activeChat.memberCount || 0} members`}
          </p>

          <div className="flex gap-3 mt-4">
            <Button variant="outline" size="icon" className="rounded-full h-11 w-11 border-[#1B2434] hover:bg-white/5">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full h-11 w-11 border-[#1B2434] hover:bg-white/5">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full h-11 w-11 border-[#1B2434] hover:bg-white/5">
              <Star className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator className="bg-[#1B2434]" />

        {/* About */}
        <div className="px-4 py-4">
          <p className="text-xs text-white/40 mb-1">About</p>
          <p className="text-sm text-white/70">
            Hey there! I am using O2H
          </p>
        </div>

        <Separator className="bg-[#1B2434]" />

        {/* Media Sections */}
        <div className="py-2">
          {sections.map((section) => (
            <button
              key={section.id}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors",
                activeSection === section.id && "bg-white/5"
              )}
              onClick={() =>
                setActiveSection(activeSection === section.id ? null : section.id)
              }
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <section.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="flex-1 text-left text-sm text-white font-medium">
                {section.label}
              </span>
              <span className="text-sm text-white/40">{section.count}</span>
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-white/30 transition-transform",
                  activeSection === section.id && "rotate-90"
                )}
              />
            </button>
          ))}
        </div>

        {/* Media Grid (when expanded) */}
        {activeSection === "media" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="px-4 pb-4"
          >
            <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden">
              {mediaItems.map((item, i) => (
                <div
                  key={i}
                  className="aspect-square bg-[#101826] border border-[#1B2434] rounded-xl flex items-center justify-center"
                >
                  {item.type === "image" ? (
                    <ImageIcon className="h-6 w-6 text-white/20" />
                  ) : item.type === "video" ? (
                    <div className="relative">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[8px] border-l-primary border-y-[5px] border-y-transparent ml-0.5" />
                      </div>
                    </div>
                  ) : (
                    <FileText className="h-6 w-6 text-white/20" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <Separator className="bg-[#1B2434]" />

        {/* Settings */}
        <div className="py-2">
          <button className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <Bell className="h-5 w-5 text-white/60" />
            </div>
            <span className="flex-1 text-left text-sm text-white">Notifications</span>
            <Switch />
          </button>

          <button className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <Star className="h-5 w-5 text-white/60" />
            </div>
            <span className="flex-1 text-left text-sm text-white">Starred Messages</span>
            <ChevronRight className="h-4 w-4 text-white/30" />
          </button>

          <button className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <HardDrive className="h-5 w-5 text-white/60" />
            </div>
            <span className="flex-1 text-left text-sm text-white">Storage</span>
            <span className="text-sm text-white/40">2.4 GB</span>
          </button>
        </div>

        <Separator className="bg-[#1B2434]" />

        {/* Encryption */}
        <div className="px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <Lock className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-white font-medium">Encryption</p>
              <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                Messages are end-to-end encrypted. No one outside of this chat
                can read them.
              </p>
            </div>
          </div>
        </div>

        <Separator className="bg-[#1B2434]" />

        {/* Group members (if group) */}
        {activeChat.type === "GROUP" && (
          <>
            <div className="px-4 py-3">
              <p className="text-xs text-white/40 mb-2">
                {activeChat.memberCount || 0} Participants
              </p>
            </div>
            <Separator className="bg-[#1B2434]" />
          </>
        )}

        {/* Actions */}
        <div className="py-2">
          <button className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors text-red-400">
            <Ban className="h-5 w-5" />
            <span className="text-sm">Block {activeChat.type === "GROUP" ? "Group" : "User"}</span>
          </button>
          <button className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors text-red-400">
            <Trash2 className="h-5 w-5" />
            <span className="text-sm">Delete Chat</span>
          </button>
        </div>
      </ScrollArea>
    </motion.div>
  );
}
