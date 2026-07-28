"use client";

import { motion } from "framer-motion";
import { MessageCircle, Phone, Users, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";

const navItems = [
  { icon: MessageCircle, label: "Chats", path: "/chat" },
  { icon: Phone, label: "Calls", path: "/chat/calls" },
  { icon: Users, label: "Contacts", path: "/chat/contacts" },
  { icon: Settings, label: "Settings", path: "/chat/settings" },
  { icon: User, label: "Profile", path: "/chat/profile" },
];

export default function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="md:hidden h-16 bg-[#0B1220] border-t border-[#1B2434] flex items-center justify-around px-2 flex-shrink-0">
      {navItems.map((item) => {
        const isActive =
          item.path === "/chat"
            ? pathname === "/chat"
            : pathname.startsWith(item.path);
        return (
          <motion.button
            key={item.path}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-colors relative",
              isActive ? "text-primary" : "text-white/40"
            )}
            onClick={() => router.push(item.path)}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
            {isActive && (
              <motion.div
                layoutId="mobileNavIndicator"
                className="absolute -top-0.5 w-6 h-0.5 bg-primary rounded-full"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
