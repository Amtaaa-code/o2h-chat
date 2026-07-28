"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Check, Users, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
  const [step, setStep] = useState<"select" | "details">("select");
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
      setStep("select");
      setSelectedUsers([]);
      setGroupName("");
      setGroupDescription("");
    }
  }, [open]);

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

  const toggleUser = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    setCreating(true);
    try {
      await api.post("/groups", {
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        memberIds: selectedUsers,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create group:", error);
    } finally {
      setCreating(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.profile?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="h-16 px-4 flex items-center gap-3 border-b border-[#1B2434]">
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-white/60 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
          <div>
            <h3 className="font-semibold text-white">
              {step === "select" ? "New Group" : "Group Details"}
            </h3>
            <p className="text-xs text-white/40">
              {step === "select"
                ? `${selectedUsers.length} participant${selectedUsers.length !== 1 ? "s" : ""} selected`
                : "Add group name and description"}
            </p>
          </div>
        </div>

        {step === "select" ? (
          <>
            {/* Search */}
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-[#101826] border-[#1B2434]"
                />
              </div>
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="px-4 pb-2">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {selectedUsers.map((userId) => {
                    const user = users.find((u) => u.id === userId);
                    if (!user) return null;
                    return (
                      <div
                        key={userId}
                        className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full pl-2 pr-3 py-1 flex-shrink-0"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback className="text-[10px]" name={user.profile?.fullName || user.username} />
                        </Avatar>
                        <span className="text-xs text-white truncate max-w-[80px]">
                          {user.profile?.fullName || user.username}
                        </span>
                        <button onClick={() => toggleUser(userId)}>
                          <X className="h-3 w-3 text-white/60" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* User List */}
            <ScrollArea className="flex-1 px-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filtered.map((user) => {
                    const isSelected = selectedUsers.includes(user.id);
                    return (
                      <motion.div
                        key={user.id}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => toggleUser(user.id)}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback name={user.profile?.fullName || user.username} />
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">
                            {user.profile?.fullName || user.username}
                          </p>
                          <p className="text-sm text-white/40">@{user.username}</p>
                        </div>
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                            isSelected
                              ? "bg-primary border-primary"
                              : "border-white/20"
                          )}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Next Button */}
            {selectedUsers.length > 0 && (
              <div className="p-4">
                <Button
                  onClick={() => setStep("details")}
                  className="w-full h-12 gradient-primary rounded-xl shadow-lg shadow-primary/25"
                >
                  Next ({selectedUsers.length})
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Group Details Form */}
            <div className="flex-1 p-6 space-y-6">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
                  <Users className="h-10 w-10 text-primary/50" />
                </div>
                <Button variant="link" className="mt-2 text-primary text-sm">
                  Add Group Icon
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-white/60">Group Name *</label>
                  <Input
                    placeholder="Enter group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="bg-[#101826] border-[#1B2434]"
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/60">Description (optional)</label>
                  <Input
                    placeholder="What is this group about?"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="bg-[#101826] border-[#1B2434]"
                    maxLength={200}
                  />
                </div>
              </div>
            </div>

            {/* Create Button */}
            <div className="p-4">
              <Button
                onClick={handleCreate}
                disabled={!groupName.trim() || creating}
                className="w-full h-12 gradient-primary rounded-xl shadow-lg shadow-primary/25"
              >
                {creating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Create Group"
                )}
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
