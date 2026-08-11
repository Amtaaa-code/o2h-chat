"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Check, UserPlus, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

interface AddMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: number;
  existingMemberIds: number[];
}

export default function AddMembersDialog({ open, onOpenChange, groupId, existingMemberIds }: AddMembersDialogProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
      setSelectedUsers([]);
      setSearch("");
    }
  }, [open]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      if (data.success) setUsers(data.data.filter((u: any) => !existingMemberIds.includes(u.id)));
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

  const handleAdd = async () => {
    if (selectedUsers.length === 0) return;
    setAdding(true);
    try {
      await api.post(`/groups/${groupId}/members`, { userIds: selectedUsers });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add members:", error);
    } finally {
      setAdding(false);
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
        className="fixed inset-0 z-50 bg-[#0B1220] md:absolute md:inset-0 flex flex-col"
      >
        <div className="h-16 px-4 flex items-center gap-3 border-b border-[#1B2434]">
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-white/60 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
          <div>
            <h3 className="font-semibold text-white">Add Members</h3>
            <p className="text-xs text-white/40">{selectedUsers.length} selected</p>
          </div>
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

        {selectedUsers.length > 0 && (
          <div className="px-4 pb-2">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {selectedUsers.map((userId) => {
                const user = users.find((u) => u.id === userId);
                if (!user) return null;
                return (
                  <div key={userId} className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full pl-2 pr-3 py-1 flex-shrink-0">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="text-[10px]" name={user.profile?.fullName || user.username} />
                    </Avatar>
                    <span className="text-xs text-white truncate max-w-[80px]">{user.profile?.fullName || user.username}</span>
                    <button onClick={() => toggleUser(userId)}><X className="h-3 w-3 text-white/60" /></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 px-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/40">
              <UserPlus className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No users found</p>
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
                      <p className="font-medium text-white truncate">{user.profile?.fullName || user.username}</p>
                      <p className="text-sm text-white/40">@{user.username}</p>
                    </div>
                    <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all", isSelected ? "bg-primary border-primary" : "border-white/20")}>
                      {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {selectedUsers.length > 0 && (
          <div className="p-4">
            <Button onClick={handleAdd} disabled={adding} className="w-full h-12 gradient-primary rounded-xl shadow-lg shadow-primary/25">
              {adding ? <Loader2 className="h-5 w-5 animate-spin" /> : `Add ${selectedUsers.length} Member${selectedUsers.length > 1 ? "s" : ""}`}
            </Button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
