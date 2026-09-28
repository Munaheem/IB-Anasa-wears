import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto bg-black text-white px-4 py-3 border border-gray-800 shadow-2xl flex items-center justify-between gap-3 text-xs tracking-wider uppercase font-semibold animate-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center gap-2">
            {t.type === 'success' && <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />}
            {t.type === 'error' && <AlertCircle size={15} className="text-red-400 shrink-0" />}
            {(!t.type || t.type === 'info') && <Info size={15} className="text-blue-400 shrink-0" />}
            <span>{t.text}</span>
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
