
import React, { useState, useEffect } from 'react';
import { User, AppNotification } from '../types';
import { dbService } from '../services/db';
import { Bell, CheckCheck } from 'lucide-react';

interface NotificationPanelProps {
  user: User;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ user, onClose }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // مراقبة لحظية للإشعارات
    const unsubscribe = dbService.subscribeToNotifications(user.uid, (notes) => {
        setNotifications(notes);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleMarkAllAsRead = async () => {
    try {
      await dbService.markNotificationsAsRead(user.uid);
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const getIconForType = (type: AppNotification['type']) => {
    switch(type) {
      case 'success': return <span className="text-green-500">🏆</span>;
      case 'warning': return <span className="text-yellow-500">⚠️</span>;
      default: return <span className="text-sky-500">🔔</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" onClick={onClose}>
      <div 
        className="absolute top-24 right-4 md:right-10 w-[95%] max-w-md h-auto max-h-[70vh] flex flex-col glass-panel rounded-[40px] border-white/10 shadow-2xl animate-slideUp overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.03]">
          <h3 className="font-black text-white flex items-center gap-3"><Bell size={18}/> مركز الإشعارات</h3>
          <button onClick={handleMarkAllAsRead} className="text-[10px] font-bold text-gray-400 hover:text-white flex items-center gap-1.5"><CheckCheck size={12}/> وضع علامة مقروء للكل</button>
        </header>
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          {isLoading ? (
            <div className="p-10 text-center text-gray-500">جاري التحميل...</div>
          ) : notifications.length > 0 ? (
            notifications.map(note => (
              <div key={note.id} className={`p-4 rounded-2xl flex gap-4 transition-all ${note.isRead ? 'opacity-50' : 'bg-sky-500/5 border border-sky-500/20'}`}>
                <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-lg shrink-0">{getIconForType(note.type)}</div>
                <div>
                  <p className={`font-bold text-sm ${note.isRead ? 'text-gray-400' : 'text-white'}`}>{note.title}</p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{note.message}</p>
                  <p className="text-[8px] text-gray-600 mt-2 font-mono uppercase">{new Date(note.timestamp).toLocaleTimeString('ar-KW')}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-gray-500 italic">لا توجد إشعارات حالياً.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
