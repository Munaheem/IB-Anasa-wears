import React, { useEffect } from 'react';
import { Bell, CheckCheck, Megaphone, Sparkles, X } from 'lucide-react';
import { CustomerNotification } from '../types';

interface CustomerNotificationsPanelProps {
  isOpen: boolean;
  notifications: CustomerNotification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

const typeStyles: Record<CustomerNotification['type'], string> = {
  news: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  message: 'bg-sky-50 text-sky-700 border-sky-200',
  alert: 'bg-amber-50 text-amber-700 border-amber-200'
};

export const CustomerNotificationsPanel: React.FC<CustomerNotificationsPanelProps> = ({
  isOpen,
  notifications,
  onClose,
  onMarkRead
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl rounded-none bg-white shadow-2xl border border-gray-200" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-gray-200 bg-black px-5 py-4 text-white">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.25em] text-gray-400">
              <Bell size={13} />
              <span>Notifications</span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-tight">Your updates</h2>
          </div>

          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white" aria-label="Close notifications">
            <X size={18} />
          </button>
        </header>

        <div className="p-5">
          <div className="mb-4 flex items-center justify-between rounded-none border border-gray-200 bg-gray-50 px-3 py-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-700">
              <Sparkles size={14} />
              <span>{unreadCount} unread</span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
              {notifications.length} total
            </span>
          </div>

          <div className="space-y-3 max-h-[62vh] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="rounded-none border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-xs uppercase tracking-[0.2em] text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((item) => (
                <article
                  key={item.id}
                  className={`border p-4 ${item.read ? 'bg-white border-gray-200' : 'bg-gray-50 border-black/10'} ${!item.read ? 'shadow-sm' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`inline-flex items-center border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.15em] ${typeStyles[item.type]}`}>
                          {item.type}
                        </span>
                        {!item.read && <span className="h-2 w-2 rounded-full bg-red-500" aria-label="Unread notification" />}
                      </div>

                      <h3 className={`text-sm font-bold uppercase tracking-tight ${item.read ? 'text-gray-800' : 'text-black'}`}>
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.message}</p>
                    </div>

                    {!item.read && (
                      <button
                        type="button"
                        onClick={() => onMarkRead(item.id)}
                        className="inline-flex items-center gap-1 border border-black px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-black hover:bg-black hover:text-white transition-colors"
                      >
                        <CheckCheck size={12} />
                        Read
                      </button>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-gray-500">
                    <Megaphone size={12} />
                    <span>{new Date(item.createdAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
