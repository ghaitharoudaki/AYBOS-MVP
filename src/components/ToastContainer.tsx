import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <aside 
      className="fixed top-5 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
      aria-label="System notifications"
    >
      {toasts.map(toast => {
        let Icon = CheckCircle2;
        let iconColor = 'text-emerald-500';
        let borderColor = 'border-slate-800';

        if (toast.type === 'error') {
          Icon = AlertCircle;
          iconColor = 'text-red-400';
          borderColor = 'border-red-900/50';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = 'text-amber-400';
          borderColor = 'border-amber-900/50';
        } else if (toast.type === 'info') {
          Icon = Info;
          iconColor = 'text-blue-400';
          borderColor = 'border-blue-900/50';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-slate-900 text-white rounded-xl p-3.5 shadow-xl border ${borderColor} flex items-center justify-between gap-3 text-sm animate-toast transition-all`}
            role="status"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
              <span className="font-medium text-slate-100 text-sm leading-snug">
                {toast.message}
              </span>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex-shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </aside>
  );
};
