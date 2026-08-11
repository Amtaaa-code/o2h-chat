"use client";

import { useEffect } from "react";
import { ToastProvider } from "@/components/Toast";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return <ToastProvider>{children}</ToastProvider>;
}
