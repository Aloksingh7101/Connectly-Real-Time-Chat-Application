import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import Avatar from '../ui/Avatar';

function describe(notification) {
  const isGroup = notification.conversation?.isGroup;
  if (notification.type === 'group_add') return `added you to ${notification.conversation?.groupName || 'a group'}`;
  if (isGroup) return `sent a message in ${notification.conversation?.groupName}`;
  return 'sent you a message';
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = () => {
    notificationService.getNotifications().then((data) => {
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open) load();
  };

  const handleMarkAll = async () => {
    await notificationService.markAllAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-10 max-h-96 w-80 overflow-y-auto rounded-xl bg-graphite-800 shadow-lg thin-scrollbar">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-coral hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-white/40">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`flex items-center gap-2.5 px-4 py-2.5 ${!n.read ? 'bg-white/5' : ''}`}
              >
                <Avatar name={n.sender?.name} src={n.sender?.avatar} size={32} />
                <p className="text-xs text-white/70">
                  <span className="font-semibold text-white">{n.sender?.name}</span> {describe(n)}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
