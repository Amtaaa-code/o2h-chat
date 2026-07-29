"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, Save, Loader2, User, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: user?.profile?.fullName || "",
    phoneNumber: user?.profile?.phoneNumber || "",
    bio: user?.profile?.bio || "",
    address: (user?.profile as any)?.address || "",
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("files", file);

      const { data: uploadData } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (uploadData.success && uploadData.data[0]) {
        const avatarUrl = uploadData.data[0].url;
        const { data } = await api.put("/users/me", { avatar: avatarUrl });
        if (data.success) {
          setUser(data.data);
          setAvatarPreview(avatarUrl);
        }
      }
    } catch (error) {
      console.error("Failed to upload avatar:", error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put("/users/me", form);
      if (data.success) {
        setUser(data.data);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#060B16]">
      {/* Header */}
      <div className="h-16 px-4 flex items-center gap-3 border-b border-[#1B2434] flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-white/60 hover:text-white h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-white">Edit Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto p-6"
        >
          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar className="h-32 w-32">
                <AvatarImage src={avatarPreview || user?.avatar || undefined} />
                <AvatarFallback
                  name={user?.profile?.fullName || user?.username}
                  className="text-4xl"
                />
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploadingAvatar ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : (
                  <Camera className="h-8 w-8 text-white" />
                )}
              </div>
            </div>
            <Button
              variant="link"
              className="mt-3 text-primary text-sm"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? "Uploading..." : "Change Profile Photo"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-white/60 text-sm">Full Name</Label>
              <Input
                placeholder="Your full name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="bg-[#101826] border-[#1B2434] h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/60 text-sm">Phone Number</Label>
              <Input
                placeholder="+62812345678"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                className="bg-[#101826] border-[#1B2434] h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/60 text-sm">Bio</Label>
              <Input
                placeholder="Hey there! I am using O2H"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="bg-[#101826] border-[#1B2434] h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/60 text-sm">Address</Label>
              <Input
                placeholder="Your address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="bg-[#101826] border-[#1B2434] h-12"
              />
            </div>

            <Separator className="bg-[#1B2434]" />

            {/* Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-white/40">Email</span>
                <span className="text-sm text-white/70">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-white/40">Username</span>
                <span className="text-sm text-white/70">@{user?.username}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-white/40">Role</span>
                <span className="text-sm text-white/70">{user?.role}</span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary h-12 rounded-xl"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              Save Changes
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
