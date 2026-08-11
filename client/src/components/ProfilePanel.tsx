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
  UserPlus,
  Copy,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { cn, getUploadUrl } from "@/lib/utils";
import api from "@/lib/axios";
import AddMembersDialog from "@/components/AddMembersDialog";

export default function ProfilePanel() {
  const { activeChat, setProfilePanelOpen, user } = useAppStore();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [mediaData, setMediaData] = useState<{ images: any[]; documents: any[]; links: any[] }>({ images: [], documents: [], links: [] });
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [chatUserData, setChatUserData] = useState<any>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [groupDescription, setGroupDescription] = useState<string>("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);

  useEffect(() => {
    if (!activeChat) return;
    const fetchData = async () => {
      setLoadingMedia(true);
      try {
        if (activeChat.type === 'PRIVATE') {
          const { data: userData } = await api.get(`/users/${activeChat.id}`);
          if (userData.success) setChatUserData(userData.data);
        }
        if (activeChat.type === 'GROUP') {
          const { data: membersData } = await api.get(`/groups/${activeChat.id}`);
          if (membersData.success) {
            setGroupMembers(membersData.data?.members || []);
            setGroupDescription(membersData.data?.description || "");
          }
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

  const handleGenerateInvite = async () => {
    if (!activeChat || activeChat.type !== 'GROUP') return;
    try {
      const { data } = await api.get(`/groups/${activeChat.id}/invite`);
      if (data.success) {
        const fullLink = `${window.location.origin}${data.data.inviteLink}`;
        setInviteLink(fullLink);
      }
    } catch (error) {
      console.error("Failed to generate invite:", error);
    }
  };

  const handleCopyInvite = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKickMember = async (memberUserId: number) => {
    if (!activeChat || activeChat.type !== 'GROUP') return;
    try {
      await api.post(`/groups/${activeChat.id}/kick`, { userId: memberUserId });
      setGroupMembers((prev) => prev.filter((m) => m.user.id !== memberUserId));
    } catch (error) {
      console.error("Failed to kick member:", error);
    }
  };

  const handleToggleAdmin = async (memberUserId: number) => {
    if (!activeChat || activeChat.type !== 'GROUP') return;
    try {
      const { data } = await api.post(`/groups/${activeChat.id}/promote`, { userId: memberUserId });
      if (data.success) {
        setGroupMembers((prev) => prev.map((m) =>
          m.user.id === memberUserId ? { ...m, role: m.role === 'ADMIN' ? 'MEMBER' : 'ADMIN' } : m
        ));
      }
    } catch (error) {
      console.error("Failed to toggle admin:", error);
    }
  };

  const handleSaveDescription = async () => {
    if (!activeChat || activeChat.type !== 'GROUP') return;
    try {
      await api.put(`/groups/${activeChat.id}`, { description: descValue });
      setGroupDescription(descValue);
      setEditingDesc(false);
    } catch (error) {
      console.error("Failed to update description:", error);
    }
  };

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
          <div className="relative group">
            <Avatar className="h-28 w-28 mb-3">
              <AvatarImage src={activeChat.avatar || undefined} />
              <AvatarFallback name={activeChat.name} className="text-3xl" />
            </Avatar>
            {activeChat.type === "GROUP" && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const formData = new FormData();
                    formData.append("files", file);
                    const { data: uploadData } = await api.post("/upload", formData, {
                      headers: { "Content-Type": "multipart/form-data" },
                    });
                    if (uploadData.success) {
                      await api.put(`/groups/${activeChat.id}`, { avatar: uploadData.data[0].url });
                      window.location.reload();
                    }
                  } catch (error) {
                    console.error("Failed to upload avatar:", error);
                  }
                }} />
                <span className="text-xs text-white font-medium">Change Photo</span>
              </label>
            )}
          </div>
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
          {activeChat.type === "GROUP" && editingDesc ? (
            <div className="flex items-center gap-2">
              <Input value={descValue} onChange={(e) => setDescValue(e.target.value)}
                placeholder="Group description..."
                className="flex-1 h-8 bg-[#0B1220] border-[#1B2434] text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveDescription(); if (e.key === 'Escape') setEditingDesc(false); }} />
              <Button size="sm" onClick={handleSaveDescription} className="h-8 px-3">Save</Button>
            </div>
          ) : (
            <p className="text-sm text-white/70 cursor-pointer hover:text-white/90" onClick={() => {
              if (activeChat.type === "GROUP") {
                setDescValue(groupDescription);
                setEditingDesc(true);
              }
            }}>
              {activeChat.type === "PRIVATE"
                ? chatUserData?.profile?.bio || "Hey there! I am using O2H"
                : groupDescription || `${activeChat.memberCount || 0} members in this group`}
            </p>
          )}
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
            <div className="px-4 py-3 space-y-2">
              <p className="text-xs text-white/40">
                {activeChat.memberCount || 0} Participants
              </p>
              {!inviteLink ? (
                <Button variant="outline" size="sm" onClick={handleGenerateInvite}
                  className="w-full border-[#1B2434] bg-white/5 hover:bg-white/10 text-white/70">
                  <UserPlus className="h-4 w-4 mr-2" /> Invite via Link
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#0B1220] rounded-lg px-3 py-2 text-xs text-white/50 truncate border border-[#1B2434]">
                    {inviteLink}
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleCopyInvite} className="h-8 w-8 flex-shrink-0">
                    {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-white/50" />}
                  </Button>
                </div>
              )}
            </div>
            {groupMembers.length > 0 && (
              <div className="px-4 pb-3 space-y-1">
                {groupMembers.map((member: any) => (
                  <div key={member.user.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/5 transition-colors group">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user.avatar || undefined} />
                      <AvatarFallback name={member.user.username} />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {member.user.username}
                        {member.user.id === user?.id && <span className="text-white/30 text-xs ml-1">(You)</span>}
                      </p>
                      <p className="text-xs text-white/40">{member.role}</p>
                    </div>
                    {member.user.id !== user?.id && member.role !== 'OWNER' && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => handleToggleAdmin(member.user.id)} className="h-7 text-xs text-white/50 hover:text-white">
                          {member.role === 'ADMIN' ? 'Demote' : 'Admin'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleKickMember(member.user.id)} className="h-7 text-xs text-red-400 hover:text-red-300">
                          Kick
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="px-4 pb-3">
              <Button variant="outline" size="sm" onClick={() => setShowAddMembers(true)}
                className="w-full border-[#1B2434] bg-white/5 hover:bg-white/10 text-white/70">
                <UserPlus className="h-4 w-4 mr-2" /> Add Member
              </Button>
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

      {/* Add Members Dialog */}
      {activeChat.type === "GROUP" && (
        <AddMembersDialog
          open={showAddMembers}
          onOpenChange={setShowAddMembers}
          groupId={parseInt(activeChat.id)}
          existingMemberIds={groupMembers.map((m: any) => m.user.id)}
        />
      )}
    </motion.div>
  );
}
