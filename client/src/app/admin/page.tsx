"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  MessageCircle,
  UsersRound,
  Activity,
  Zap,
  Trash2,
  Shield,
  Search,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    activeGroups: 0,
    onlineUsers: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "users">("dashboard");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          api.get("/users/admin/stats").catch(() => ({ data: { data: { totalUsers: 0, totalMessages: 0, activeGroups: 0, onlineUsers: 0 } } })),
          api.get("/users/admin/users").catch(() => ({ data: { data: [] } })),
        ]);
        setStats(statsRes.data?.data || { totalUsers: 0, totalMessages: 0, activeGroups: 0, onlineUsers: 0 });
        setUsers(usersRes.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setStats((prev) => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
    } catch (error) {
      alert("Failed to delete user");
    }
  };

  const statCards = [
    { title: "Total Users", value: String(stats.totalUsers), icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { title: "Total Messages", value: String(stats.totalMessages), icon: MessageCircle, color: "text-green-400", bg: "bg-green-400/10" },
    { title: "Active Groups", value: String(stats.activeGroups), icon: UsersRound, color: "text-purple-400", bg: "bg-purple-400/10" },
    { title: "Online Now", value: String(stats.onlineUsers), icon: Activity, color: "text-orange-400", bg: "bg-orange-400/10" },
  ];

  const filteredUsers = users.filter(
    (u) => u.username?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) || u.profile?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#060B16]">
      <div className="max-w-7xl mx-auto p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              <p className="text-sm text-white/40 mt-0.5">O2H Administration</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={activeTab === "dashboard" ? "default" : "ghost"}
                onClick={() => setActiveTab("dashboard")}
                className={activeTab === "dashboard" ? "gradient-primary" : "text-white/60"}
              >
                Dashboard
              </Button>
              <Button
                variant={activeTab === "users" ? "default" : "ghost"}
                onClick={() => setActiveTab("users")}
                className={activeTab === "users" ? "gradient-primary" : "text-white/60"}
              >
                <Users className="h-4 w-4 mr-2" /> Users
              </Button>
            </div>
          </div>

          {activeTab === "dashboard" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statCards.map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="panel-card p-5 hover-lift"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                    <p className="text-sm text-white/40 mt-1">{stat.title}</p>
                  </motion.div>
                ))}
              </div>

              <div className="panel-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold text-white">System Health</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "Database", status: "Connected", ok: true },
                    { label: "Socket.IO", status: "Running", ok: true },
                    { label: "Upload Service", status: "Active", ok: true },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.ok ? "bg-green-400" : "bg-red-400"}`} />
                      <div>
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className={`text-xs ${item.ok ? "text-green-400" : "text-red-400"}`}>{item.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
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

              <div className="panel-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1B2434]">
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase">User</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase">Email</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase">Role</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase">Joined</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-white/40 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={6} className="text-center py-8 text-white/40">Loading...</td></tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-8 text-white/40">No users found</td></tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="border-b border-[#1B2434] hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={u.avatar || undefined} />
                                  <AvatarFallback name={u.profile?.fullName || u.username} className="text-xs" />
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium text-white">{u.profile?.fullName || u.username}</p>
                                  <p className="text-xs text-white/40">@{u.username}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-white/60">{u.email}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "ADMIN" ? "bg-primary/20 text-primary" : "bg-white/10 text-white/60"}`}>
                                {u.role === "ADMIN" && <Shield className="h-3 w-3" />}
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 text-xs ${u.isOnline ? "text-green-400" : "text-white/40"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${u.isOnline ? "bg-green-400" : "bg-white/20"}`} />
                                {u.isOnline ? "Online" : "Offline"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-white/40">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {u.role !== "ADMIN" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-400 hover:text-red-400 hover:bg-red-400/10"
                                  onClick={() => handleDeleteUser(u.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
