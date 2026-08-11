"use client";

import { useState, useCallback, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="h-4 w-4 text-green-400" />,
    error: <AlertCircle className="h-4 w-4 text-red-400" />,
    info: <Info className="h-4 w-4 text-blue-400" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
  };

  const borderColors: Record<ToastType, string> = {
    success: "border-green-400/30",
    error: "border-red-400/30",
    info: "border-blue-400/30",
    warning: "border-yellow-400/30",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={cn(
                "bg-[#101826] border rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3",
                borderColors[t.type]
              )}
            >
              {icons[t.type]}
              <p className="text-sm text-white/80 flex-1">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-white/30 hover:text-white/60">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
