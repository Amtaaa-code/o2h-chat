"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Phone,
  Users,
  Aperture,
  Star,
  Archive,
  Settings,
  LogOut,
  Bell,
  ChevronLeft,
  ChevronRight,
  Moon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { useRouter, usePathname } from "next/navigation";

const menuItems = [
  { icon: MessageCircle, label: "Chats", id: "chats", path: "/chat" },
  { icon: Aperture, label: "Stories", id: "stories", path: "/chat" },
  { icon: Phone, label: "Calls", id: "calls", path: "/chat/calls" },
  { icon: Users, label: "Contacts", id: "contacts", path: "/chat/contacts" },
  { icon: Star, label: "Starred", id: "starred", path: "/chat" },
  { icon: Archive, label: "Archived", id: "archived", path: "/chat" },
  { icon: Bell, label: "Notifications", id: "notifications", path: "/chat" },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      router.push("/login");
    }
  };

  const isActive = (path: string, id: string) => {
    if (id === "chats") return pathname === "/chat";
    return pathname.startsWith(path);
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "h-full bg-[#0B1220] border-r border-[#1B2434] flex flex-col items-center py-4 transition-all duration-300",
        sidebarCollapsed ? "w-[68px]" : "w-[72px]"
      )}
    >
      <div className="flex flex-col items-center gap-1 flex-1">
        {/* Logo */}
        <div
          className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-primary/20 cursor-pointer hover:shadow-primary/40 transition-shadow"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <span className="text-lg font-bold text-white">O2H</span>
        </div>

        <Separator className="w-8 bg-[#1B2434] mb-2" />

        {/* Menu Items */}
        {menuItems.map((item) => {
          const active = isActive(item.path, item.id);
          return (
            <div key={item.id} className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn("sidebar-item", active && "active")}
                onClick={() => router.push(item.path)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <item.icon className="h-5 w-5" />
                {item.id === "notifications" && (
                  <span className="badge-dot bg-red-500" />
                )}
              </motion.button>

              {/* Tooltip */}
              <AnimatePresence>
                {hoveredItem === item.id && (
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    className="absolute left-full ml-3 px-3 py-1.5 bg-[#101826] rounded-xl text-xs text-white font-medium pointer-events-none whitespace-nowrap z-50 border border-[#1B2434] shadow-xl top-1/2 -translate-y-1/2"
                  >
                    {item.label}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-1">
        <Separator className="w-8 bg-[#1B2434] mb-2" />

        {/* Settings */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn("sidebar-item", pathname === "/chat/settings" && "active")}
            onClick={() => router.push("/chat/settings")}
            onMouseEnter={() => setHoveredItem("settings")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <Settings className="h-5 w-5" />
          </motion.button>
          <AnimatePresence>
            {hoveredItem === "settings" && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                className="absolute left-full ml-3 px-3 py-1.5 bg-[#101826] rounded-xl text-xs text-white font-medium pointer-events-none whitespace-nowrap z-50 border border-[#1B2434] shadow-xl top-1/2 -translate-y-1/2"
              >
                Settings
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Avatar */}
        <div className="relative my-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/chat/profile")}
          >
            <Avatar className="h-10 w-10 border-2 border-primary/30 hover:border-primary/60 transition-colors">
              <AvatarImage src={user?.avatar || undefined} />
              <AvatarFallback name={user?.profile?.fullName || user?.username} />
            </Avatar>
          </motion.button>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0B1220] shadow-sm" />
        </div>

        {/* Logout */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="sidebar-item text-white/50 hover:!text-red-400 hover:!bg-red-400/10"
            onClick={handleLogout}
            onMouseEnter={() => setHoveredItem("logout")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <LogOut className="h-5 w-5" />
          </motion.button>
          <AnimatePresence>
            {hoveredItem === "logout" && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                className="absolute left-full ml-3 px-3 py-1.5 bg-[#101826] rounded-xl text-xs text-red-400 font-medium pointer-events-none whitespace-nowrap z-50 border border-[#1B2434] shadow-xl top-1/2 -translate-y-1/2"
              >
                Logout
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
