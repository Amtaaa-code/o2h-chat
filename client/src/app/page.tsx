"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      router.push("/chat");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060B16]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center animate-pulse">
          <span className="text-2xl font-bold text-white">O2H</span>
        </div>
        <p className="text-white/60 text-sm">Loading...</p>
      </div>
    </div>
  );
}
