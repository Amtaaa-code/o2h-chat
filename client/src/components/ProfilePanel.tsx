"use client";

import { useState, useEffect } from "react";
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
import { cn, getUploadUrl } from "@/lib/utils";
import api from "@/lib/axios";

export default function ProfilePanel() {
  const { activeChat, setProfilePanelOpen } = useAppStore();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [mediaData, setMediaData] = useState<{ images: any[]; documents: any[]; links: any[] }>({ images: [], documents: [], links: [] });
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [chatUserData, setChatUserData] = useState<any>(null);

  useEffect(() => {
    if (!activeChat) return;
    const fetchData = async () => {
      setLoadingMedia(true);
      try {
        if (activeChat.type === 'PRIVATE') {
          const { data: userData } = await api.get(`/users/${activeChat.id}`);
          if (userData.success) setChatUserData(userData.data);
        }
        const { data } = await api.get(`/messages/${activeChat.type}/${activeChat.id}?limit=200`);
        if (data.success) {
          const messages = data.data || [];
          const images: any[] = [];
          const documents: any[] = [];
          const links: any[] = [];
          for (const msg of messages) {
            if (msg.attachments) {
              for (const att of msg.attachments) {
                if (att.mimeType.startsWith("image/") || att.mimeType.startsWith("video/")) {
                  images.push(att);
                } else {
                  documents.push(att);
                }
              }
            }
            if (msg.content) {
              const urlMatch = msg.content.match(/https?:\/\/[^\s]+/g);
              if (urlMatch) links.push(...urlMatch.map((url: string) => ({ url })));
            }
          }
          setMediaData({ images, documents, links });
        }
      } catch (error) {
        console.error("Failed to fetch media:", error);
      } finally {
        setLoadingMedia(false);
      }
    };
    fetchData();
  }, [activeChat?.id]);

  if (!activeChat) return null;

  const sections = [
    { icon: ImageIcon, label: "Media, Links, and Docs", count: mediaData.images.length, id: "media" },
    { icon: FileText, label: "Documents", count: mediaData.documents.length, id: "docs" },
    { icon: Link, label: "Shared Links", count: mediaData.links.length, id: "links" },
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
            {activeChat.type === "PRIVATE"
              ? chatUserData?.profile?.bio || "Hey there! I am using O2H"
              : `${activeChat.memberCount || 0} members in this group`}
          </p>
          {activeChat.type === "PRIVATE" && chatUserData?.profile?.phoneNumber && (
            <p className="text-xs text-white/40 mt-2">{chatUserData.profile.phoneNumber}</p>
          )}
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
            {loadingMedia ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : mediaData.images.length === 0 ? (
              <p className="text-center text-white/30 text-sm py-4">No media yet</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden">
                {mediaData.images.slice(0, 12).map((item, i) => (
                  <div key={i} className="aspect-square bg-[#101826] border border-[#1B2434] rounded-xl overflow-hidden">
                    <img src={getUploadUrl(item.url)} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeSection === "docs" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="px-4 pb-4"
          >
            {loadingMedia ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : mediaData.documents.length === 0 ? (
              <p className="text-center text-white/30 text-sm py-4">No documents yet</p>
            ) : (
              <div className="space-y-2">
                {mediaData.documents.map((doc, i) => (
                  <a key={i} href={getUploadUrl(doc.url)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{doc.originalName}</p>
                      <p className="text-xs text-white/40">{(doc.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeSection === "links" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="px-4 pb-4"
          >
            {loadingMedia ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : mediaData.links.length === 0 ? (
              <p className="text-center text-white/30 text-sm py-4">No links yet</p>
            ) : (
              <div className="space-y-2">
                {mediaData.links.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <Link className="h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-sm text-primary truncate flex-1">{link.url}</p>
                  </a>
                ))}
              </div>
            )}
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
