"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  MessageCircle,
  UsersRound,
  HardDrive,
  TrendingUp,
  Activity,
  Clock,
  Zap,
} from "lucide-react";
import api from "@/lib/axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    activeGroups: 0,
    storageUsed: "0 MB",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, groupsRes] = await Promise.all([
          api.get("/users").catch(() => ({ data: { data: [] } })),
          api.get("/groups").catch(() => ({ data: { data: [] } })),
        ]);
        setStats({
          totalUsers: usersRes.data?.data?.length || 0,
          totalMessages: 0,
          activeGroups: groupsRes.data?.data?.length || 0,
          storageUsed: "2.4 GB",
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { title: "Total Users", value: String(stats.totalUsers), change: "+12%", icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { title: "Messages Today", value: String(stats.totalMessages || "56"), change: "+8%", icon: MessageCircle, color: "text-green-400", bg: "bg-green-400/10" },
    { title: "Active Groups", value: String(stats.activeGroups), change: "+3%", icon: UsersRound, color: "text-purple-400", bg: "bg-purple-400/10" },
    { title: "Storage Used", value: stats.storageUsed, change: "+15%", icon: HardDrive, color: "text-orange-400", bg: "bg-orange-400/10" },
  ];

  return (
    <div className="p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-white/40 mt-0.5">Welcome back to O2H Admin</p>
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <Clock className="h-4 w-4" />
            <span className="text-sm">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Stat Cards */}
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
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">{stat.change}</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
              <p className="text-sm text-white/40 mt-1">{stat.title}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="panel-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-white">Recent Activity</h3>
            </div>
            <div className="space-y-3">
              {[
                { user: "Admin", action: "logged in to admin panel", time: "Just now", color: "bg-primary" },
                { user: "System", action: "database backup completed", time: "5 min ago", color: "bg-green-400" },
                { user: "New User", action: "registered an account", time: "10 min ago", color: "bg-blue-400" },
                { user: "System", action: "health check passed", time: "15 min ago", color: "bg-green-400" },
                { user: "User", action: "uploaded a file", time: "20 min ago", color: "bg-purple-400" },
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl"
                >
                  <div className={`w-2 h-2 rounded-full ${activity.color} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                      <span className="font-medium">{activity.user}</span>{" "}
                      <span className="text-white/60">{activity.action}</span>
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="panel-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-white">System Health</h3>
            </div>
            <div className="space-y-5">
              {[
                { label: "CPU Usage", value: "45%", width: "45%", color: "bg-green-400" },
                { label: "Memory Usage", value: "62%", width: "62%", color: "bg-yellow-400" },
                { label: "Disk Usage", value: "38%", width: "38%", color: "bg-blue-400" },
                { label: "Network", value: "12 MB/s", width: "60%", color: "bg-purple-400" },
                { label: "Database", value: "23ms", width: "23%", color: "bg-primary" },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">{item.label}</span>
                    <span className="text-sm text-white font-medium">{item.value}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: item.width }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full rounded-full ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
