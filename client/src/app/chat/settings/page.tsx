"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Shield,
  Bell,
  Palette,
  Globe,
  HardDrive,
  Database,
  Ban,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Lock,
  Eye,
  EyeOff,
  MessageCircle,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    fullName: user?.profile?.fullName || "",
    phoneNumber: user?.profile?.phoneNumber || "",
    bio: user?.profile?.bio || "",
  });

  const settingsSections = [
    {
      id: "profile",
      icon: User,
      title: "Edit Profile",
      description: "Update your personal information",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      id: "privacy",
      icon: Shield,
      title: "Privacy",
      description: "Control who can see your information",
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      id: "notifications",
      icon: Bell,
      title: "Notifications",
      description: "Manage notification preferences",
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
    },
    {
      id: "theme",
      icon: Palette,
      title: "Theme",
      description: "Customize appearance",
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
    {
      id: "language",
      icon: Globe,
      title: "Language",
      description: "Select your preferred language",
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
    },
    {
      id: "storage",
      icon: HardDrive,
      title: "Storage & Data",
      description: "Manage storage usage",
      color: "text-orange-400",
      bg: "bg-orange-400/10",
    },
    {
      id: "security",
      icon: Lock,
      title: "Security",
      description: "Two-factor authentication, sessions",
      color: "text-red-400",
      bg: "bg-red-400/10",
    },
  ];

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      router.push("/login");
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{user?.profile?.fullName}</h3>
                <p className="text-sm text-white/60">@{user?.username}</p>
                <Button variant="link" className="p-0 h-auto text-primary text-sm">
                  Change Photo
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: "Full Name", key: "fullName", placeholder: "John Doe" },
                { label: "Phone Number", key: "phoneNumber", placeholder: "+62812345678" },
                { label: "Bio", key: "bio", placeholder: "Hey there! I am using O2H" },
              ].map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-xs text-white/40 font-medium">{field.label}</label>
                  <Input
                    placeholder={field.placeholder}
                    value={(profileForm as any)[field.key]}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, [field.key]: e.target.value })
                    }
                    className="bg-[#0B1220] border-[#1B2434] h-11"
                  />
                </div>
              ))}
              <Button
                className="w-full gradient-primary h-11"
                onClick={async () => {
                  try {
                    const { data } = await api.put("/users/me", profileForm);
                    if (data.success) {
                      setUser(data.data);
                    }
                  } catch (error) {
                    console.error("Failed to update profile:", error);
                  }
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        );

      case "theme":
        return (
          <div className="space-y-3">
            <p className="text-sm text-white/60">Choose your preferred theme</p>
            {[
              { id: "dark", icon: Moon, label: "Dark Mode", desc: "Easy on the eyes" },
              { id: "light", icon: Sun, label: "Light Mode", desc: "Bright and clean" },
              { id: "system", icon: Monitor, label: "System", desc: "Match your device" },
            ].map((theme) => (
              <button
                key={theme.id}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all",
                  theme.id === "dark"
                    ? "border-primary/50 bg-primary/10"
                    : "border-[#1B2434] bg-[#0B1220] hover:border-white/20"
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", theme.id === "dark" ? "bg-primary/20" : "bg-white/5")}>
                  <theme.icon className={cn("h-5 w-5", theme.id === "dark" ? "text-primary" : "text-white/60")} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium text-white">{theme.label}</p>
                  <p className="text-sm text-white/40">{theme.desc}</p>
                </div>
                {theme.id === "dark" && (
                  <div className="w-3 h-3 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-3">
            {[
              { label: "Message Notifications", desc: "Receive notifications for new messages", icon: MessageCircle, default: true },
              { label: "Call Notifications", desc: "Receive notifications for incoming calls", icon: Phone, default: true },
              { label: "Group Notifications", desc: "Receive notifications for group messages", icon: Bell, default: true },
              { label: "Sound", desc: "Play sound for notifications", icon: Bell, default: true },
              { label: "Show Preview", desc: "Show message content in notifications", icon: Eye, default: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-[#0B1220] rounded-2xl border border-[#1B2434]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-white/60" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">{item.label}</p>
                    <p className="text-xs text-white/40">{item.desc}</p>
                  </div>
                </div>
                <Switch defaultChecked={item.default} />
              </div>
            ))}
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-3">
            {[
              { label: "Last Seen", desc: "Show when you were last online", icon: Eye, default: true },
              { label: "Profile Photo", desc: "Who can see your photo", icon: User, default: true },
              { label: "Read Receipts", desc: "Show blue ticks when you read messages", icon: MessageCircle, default: true },
              { label: "Groups", desc: "Who can add you to groups", icon: Ban, default: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-[#0B1220] rounded-2xl border border-[#1B2434]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-white/60" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">{item.label}</p>
                    <p className="text-xs text-white/40">{item.desc}</p>
                  </div>
                </div>
                <Switch defaultChecked={item.default} />
              </div>
            ))}
          </div>
        );

      case "language":
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/60 mb-3">Select your preferred language</p>
            {[
              { code: "en", label: "English", native: "English" },
              { code: "id", label: "Indonesian", native: "Bahasa Indonesia" },
              { code: "ms", label: "Malay", native: "Bahasa Melayu" },
              { code: "ar", label: "Arabic", native: "العربية" },
              { code: "es", label: "Spanish", native: "Español" },
              { code: "pt", label: "Portuguese", native: "Português" },
            ].map((lang) => (
              <button
                key={lang.code}
                className={cn(
                  "w-full flex items-center gap-4 p-3 rounded-2xl border transition-all",
                  lang.code === "en"
                    ? "border-primary/50 bg-primary/10"
                    : "border-[#1B2434] bg-[#0B1220] hover:border-white/20"
                )}
              >
                <div className="text-left flex-1">
                  <p className="font-medium text-white text-sm">{lang.label}</p>
                  <p className="text-xs text-white/40">{lang.native}</p>
                </div>
                {lang.code === "en" && (
                  <div className="w-3 h-3 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        );

      case "storage":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-[#0B1220] rounded-2xl border border-[#1B2434]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white">Total Storage Used</span>
                <span className="text-sm font-bold text-white">2.4 GB</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-[38%] bg-primary rounded-full" />
              </div>
              <div className="flex justify-between mt-2 text-xs text-white/40">
                <span>2.4 GB of 6.0 GB</span>
                <span>38%</span>
              </div>
            </div>

            {[
              { label: "Messages", size: "1.2 GB", width: "50%" },
              { label: "Photos", size: "680 MB", width: "28%" },
              { label: "Videos", size: "340 MB", width: "14%" },
              { label: "Documents", size: "120 MB", width: "5%" },
              { label: "Audio", size: "60 MB", width: "3%" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white/70">{item.label}</span>
                    <span className="text-sm text-white/40">{item.size}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: item.width }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Palette className="h-8 w-8 text-primary/50" />
            </div>
            <p className="text-white/40 text-sm">Select a setting to configure</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#060B16]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <h1 className="text-xl font-bold text-white">Settings</h1>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Settings List */}
        <div className="w-full md:w-[280px] space-y-1 px-2 md:border-r border-[#1B2434] overflow-y-auto scrollbar-thin flex-shrink-0 pb-4">
          {settingsSections.map((section) => (
            <motion.button
              key={section.id}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-2xl transition-all",
                activeSection === section.id
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-white/5"
              )}
              onClick={() => setActiveSection(section.id)}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", section.bg)}>
                <section.icon className={cn("h-5 w-5", section.color)} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-white text-sm">{section.title}</p>
                <p className="text-xs text-white/40">{section.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-white/20" />
            </motion.button>
          ))}

          <Separator className="bg-[#1B2434] my-3" />

          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-red-400/10 transition-all text-red-400"
            onClick={handleLogout}
          >
            <div className="w-10 h-10 rounded-xl bg-red-400/10 flex items-center justify-center">
              <LogOut className="h-5 w-5" />
            </div>
            <span className="font-medium text-sm">Logout</span>
          </motion.button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          <motion.div
            key={activeSection || "empty"}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderSection()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
