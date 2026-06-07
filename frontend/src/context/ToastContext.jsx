import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

let toastId = 0;

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), duration);
    return id;
  }, [removeToast]);

  const toast = {
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
    warning: (msg) => addToast(msg, "warning"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

const typeStyles = {
  success: "border-green-500/30 bg-green-500/10 text-green-400",
  error: "border-red-500/30 bg-red-500/10 text-red-400",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
};

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg animate-slide-up text-sm font-medium ${typeStyles[t.type]}`}
        >
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-zinc-500 hover:text-white transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
