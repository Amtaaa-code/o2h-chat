"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  ArrowLeft,
  Search,
  Clock,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatTime, formatDate } from "@/lib/utils";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

interface Call {
  id: number;
  type: "VOICE" | "VIDEO";
  status: "INCOMING" | "OUTGOING" | "MISSED" | "ACCEPTED" | "REJECTED" | "ENDED";
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  caller: {
    id: number;
    username: string;
    avatar: string | null;
    profile?: { fullName: string };
  };
  target: {
    id: number;
    username: string;
    avatar: string | null;
    profile?: { fullName: string };
  };
}

export default function CallsPage() {
  const router = useRouter();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "missed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      const { data } = await api.get("/calls");
      if (data.success) setCalls(data.data);
    } catch (error) {
      console.error("Failed to fetch calls:", error);
    } finally {
      setLoading(false);
    }
  };

  let filteredCalls = filter === "missed"
    ? calls.filter((c) => c.status === "MISSED")
    : calls;

  if (searchQuery) {
    filteredCalls = filteredCalls.filter((c) => {
      const name = c.caller.profile?.fullName || c.caller.username;
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "INCOMING":
      case "ACCEPTED":
        return <PhoneIncoming className="h-4 w-4 text-green-400" />;
      case "OUTGOING":
        return <PhoneOutgoing className="h-4 w-4 text-blue-400" />;
      case "MISSED":
        return <PhoneMissed className="h-4 w-4 text-red-400" />;
      default:
        return <Phone className="h-4 w-4 text-white/40" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "INCOMING": return "Incoming";
      case "OUTGOING": return "Outgoing";
      case "MISSED": return "Missed";
      case "ACCEPTED": return "Accepted";
      case "REJECTED": return "Rejected";
      case "ENDED": return "Ended";
      default: return status;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#060B16]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Calls</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white h-9 w-9">
            <Search className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search calls..."
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
      <div className="px-4 pb-3 flex gap-1.5">
        {(["all", "missed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
              filter === tab
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-[#101826] text-white/50 hover:text-white hover:bg-[#1B2434]"
            )}
          >
            {tab === "all" ? "All Calls" : "Missed"}
          </button>
        ))}
      </div>

      {/* Call List */}
      <ScrollArea className="flex-1 px-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Phone className="h-8 w-8 text-primary/50" />
            </div>
            <p className="text-white/40 text-sm font-medium">
              {filter === "missed" ? "No missed calls" : "No calls yet"}
            </p>
            <p className="text-white/30 text-xs mt-1">
              {filter === "missed"
                ? "You're all caught up!"
                : "Start a call from a chat"}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredCalls.map((call) => {
              const otherUser =
                call.caller.id === call.target.id
                  ? call.caller
                  : call.target;
              const callerName =
                otherUser.profile?.fullName || otherUser.username;

              return (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={otherUser.avatar || undefined} />
                      <AvatarFallback name={callerName} />
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-medium truncate",
                        call.status === "MISSED" ? "text-red-400" : "text-white"
                      )}
                    >
                      {callerName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {getStatusIcon(call.status)}
                      <span className="text-xs text-white/40">
                        {getStatusText(call.status)} &middot; {formatDate(call.startedAt)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/60 hover:text-primary h-10 w-10 flex-shrink-0"
                  >
                    {call.type === "VIDEO" ? (
                      <Video className="h-5 w-5" />
                    ) : (
                      <Phone className="h-5 w-5" />
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
