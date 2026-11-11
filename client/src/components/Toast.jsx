import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export default function Toast({ message, type = "success", onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const icons = {
    success: <CheckCircle2 size={16} className="text-emerald-600" />,
    error: <AlertCircle size={16} className="text-rose-600" />,
    info: <Info size={16} className="text-violet-600" />
  };

  const borders = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-rose-200 bg-rose-50 text-rose-900",
    info: "border-violet-200 bg-violet-50 text-violet-900"
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200">
      <div className={`flex items-center gap-2.5 text-xs font-semibold ${borders[type] || borders.info} rounded-lg px-3 py-2 border`}>
        {icons[type] || icons.info}
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-slate-400 hover:text-slate-700 transition"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
