"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, MoreVertical, X, MessageCircle, Phone, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/lib/store";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

interface Contact {
  id: number;
  target: {
    id: number;
    username: string;
    avatar: string | null;
    isOnline: boolean;
    profile: { fullName: string; phoneNumber?: string } | null;
  };
  nickname?: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newContactUsername, setNewContactUsername] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const { setActiveChat } = useAppStore();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const { data } = await api.get("/contacts");
      if (data.success) setContacts(data.data);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await api.get(`/search?q=${encodeURIComponent(query)}&type=users`);
      setSearchResults(data.data || []);
    } catch (error) {
      console.error("Failed to search users:", error);
    } finally {
      setSearching(false);
    }
  };

  const addContact = async (userId: number) => {
    try {
      await api.post("/contacts", { targetId: userId });
      fetchContacts();
      setShowAddDialog(false);
      setNewContactUsername("");
      setSearchResults([]);
    } catch (error) {
      console.error("Failed to add contact:", error);
    }
  };

  const filteredContacts = contacts.filter((c) =>
    (c.target.profile?.fullName || c.target.username)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#060B16]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between flex-shrink-0">
        <h1 className="text-xl font-bold text-white">Contacts</h1>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="gradient-primary h-9 rounded-xl text-sm"
          size="sm"
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          Add
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-[#101826] border-[#1B2434] rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Contact List */}
      <ScrollArea className="flex-1 px-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="h-8 w-8 text-primary/50" />
            </div>
            <p className="text-white/40 text-sm font-medium">
              {searchQuery ? "No contacts found" : "No contacts yet"}
            </p>
            <p className="text-white/30 text-xs mt-1">
              Add contacts to start chatting
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredContacts.map((contact) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => {
                  setActiveChat({
                    id: String(contact.target.id),
                    type: "PRIVATE",
                    name: contact.nickname || contact.target.profile?.fullName || contact.target.username,
                    avatar: contact.target.avatar,
                    unreadCount: 0,
                    isOnline: contact.target.isOnline,
                  });
                }}
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={contact.target.avatar || undefined} />
                    <AvatarFallback name={contact.target.profile?.fullName || contact.target.username} />
                  </Avatar>
                  {contact.target.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#060B16]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {contact.nickname || contact.target.profile?.fullName || contact.target.username}
                  </p>
                  <p className="text-sm text-white/40 truncate">
                    @{contact.target.username}
                    {contact.target.profile?.phoneNumber && (
                      <span className="text-white/20"> &middot; {contact.target.profile.phoneNumber}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-primary">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-white">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Add Contact Dialog */}
      <AnimatePresence>
        {showAddDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#0B1220] flex flex-col"
          >
            <div className="h-16 px-4 flex items-center gap-3 border-b border-[#1B2434]">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowAddDialog(false);
                  setNewContactUsername("");
                  setSearchResults([]);
                }}
                className="text-white/60 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
              <h3 className="font-semibold text-white">Add Contact</h3>
            </div>

            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search by username or name..."
                  value={newContactUsername}
                  onChange={(e) => {
                    setNewContactUsername(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  className="pl-10 bg-[#101826] border-[#1B2434]"
                  autoFocus
                />
              </div>
            </div>

            <ScrollArea className="flex-1 px-2">
              {searching ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-0.5">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors"
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
                      <Button
                        onClick={() => addContact(user.id)}
                        className="gradient-primary h-9 rounded-xl text-sm"
                        size="sm"
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              ) : newContactUsername.length > 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/40 text-sm">No users found</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserPlus className="h-12 w-12 text-white/10 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">Search for users to add</p>
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
