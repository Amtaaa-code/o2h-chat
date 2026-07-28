"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  MessageCircle,
  UsersRound,
  AlertTriangle,
  HardDrive,
  Activity,
  BarChart3,
  Settings,
  ArrowLeft,
  Shield,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: MessageCircle, label: "Messages", path: "/admin/messages" },
  { icon: UsersRound, label: "Groups", path: "/admin/groups" },
  { icon: AlertTriangle, label: "Reports", path: "/admin/reports" },
  { icon: HardDrive, label: "Storage", path: "/admin/storage" },
  { icon: Activity, label: "Logs", path: "/admin/logs" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get("/users/me");
        if (data.success && data.data.role === "ADMIN") {
          setUser(data.data);
        } else {
          router.push("/chat");
        }
      } catch {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060B16]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center animate-pulse-glow">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <p className="text-white/60 text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060B16] flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#0B1220] border-r border-[#1B2434] flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-[#1B2434]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white">Admin Panel</h2>
              <p className="text-xs text-white/40">O2H Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3">
          <div className="space-y-1 px-3">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-[#1B2434]">
          <div className="flex items-center gap-3 px-2 mb-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback name={user.profile?.fullName || user.username} />
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.profile?.fullName || user.username}
              </p>
              <p className="text-xs text-white/40">{user.role}</p>
            </div>
          </div>
          <Button asChild variant="ghost" className="w-full justify-start text-white/60 hover:text-white">
            <Link href="/chat">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chat
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
