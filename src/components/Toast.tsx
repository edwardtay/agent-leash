import { useEffect, useState } from "react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const bgColor = toast.type === "success" 
    ? "bg-green-500/20 border-green-500/50 text-green-400"
    : toast.type === "error"
    ? "bg-red-500/20 border-red-500/50 text-red-400"
    : "bg-blue-500/20 border-blue-500/50 text-blue-400";

  const icon = toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️";

  return (
    <div
      className={`px-4 py-3 rounded-xl border ${bgColor} backdrop-blur-sm transition-all duration-300 ${
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
      }`}
    >
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-sm">{toast.message}</span>
        <button onClick={() => onRemove(toast.id)} className="ml-2 opacity-50 hover:opacity-100">×</button>
      </div>
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage["type"], message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}
