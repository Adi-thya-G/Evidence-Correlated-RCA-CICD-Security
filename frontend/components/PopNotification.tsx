import { useEffect, useState } from "react";
import {
  GitBranch,
  Play,
  CheckCircle2,
  ShieldAlert,
  GitPullRequest,
  Ban,
  Bell,
  Trash2,
} from "lucide-react";

import { FaGithub } from "react-icons/fa";

// Change this to the SSE route exposed by event.controller
const EVENTS_URL = import.meta.env.VITE_API_BASE_URL+"/api/v1/event";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  unread: boolean;
};

const notificationConfig: Record<
  string,
  {
    icon: React.ElementType;
    iconClass: string;
    bgClass: string;
  }
> = {
  github: {
    icon: FaGithub,
    iconClass: "text-gray-800",
    bgClass: "bg-gray-100",
  },
  repository: {
    icon: GitBranch,
    iconClass: "text-blue-600",
    bgClass: "bg-blue-50",
  },
  pipeline: {
    icon: Play,
    iconClass: "text-violet-600",
    bgClass: "bg-violet-50",
  },
  sonarqube: {
    icon: CheckCircle2,
    iconClass: "text-green-600",
    bgClass: "bg-green-50",
  },
  security: {
    icon: ShieldAlert,
    iconClass: "text-orange-600",
    bgClass: "bg-orange-50",
  },
  correlation: {
    icon: GitPullRequest,
    iconClass: "text-purple-600",
    bgClass: "bg-purple-50",
  },
  deployment: {
    icon: Ban,
    iconClass: "text-red-600",
    bgClass: "bg-red-50",
  },
};

const timeAgo = (iso: string) => {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} d ago`;
};

function PopNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [, setTick] = useState(0);

  // Live stream from the backend 
  useEffect(() => {
    const es = new EventSource(EVENTS_URL, { withCredentials: true });

    es.addEventListener("notification", (e) => {
      try {
        console.log("Received notification  event :", e);
        const incoming: Notification = JSON.parse((e as MessageEvent).data);
        setNotifications((prev) =>
          prev.some((n) => n.id === incoming.id)
            ? prev
            : [incoming, ...prev].slice(0, 50), // newest first, keep last 50
        );
      } catch (err) {
        console.error("Invalid notification payload", err);
      }
    });

    es.onerror = () => {
      // EventSource reconnects automatically
      console.warn("Notification stream disconnected, retrying...");
    };

    return () => es.close();
  }, []);

  // Refresh the relative times every minute
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const clearAll = () => {
    setNotifications([]);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
  };

  return (
    <div className="absolute right-4 top-4 z-50 w-105 max-md:w-[calc(100vw-2rem)] h-120 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell size={18} className="text-gray-800" />

              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-semibold">
                  {unreadCount}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Pipeline activity
              </h2>

              <p className="text-[11px] text-gray-500">
                Recent updates from your pipelines
              </p>
            </div>
          </div>

          <button
            onClick={clearAll}
            disabled={notifications.length === 0}
            className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition cursor-pointer"
            title="Clear all"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {notifications.length > 0 && unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="mt-3 text-[11px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-6">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Bell size={20} className="text-gray-400" />
            </div>

            <p className="text-sm font-medium text-gray-700">
              No notifications
            </p>

            <p className="text-xs text-gray-400 mt-1 text-center">
              Pipeline updates and security events will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notification) => {
            const config =
              notificationConfig[notification.type] ??
              notificationConfig.pipeline;

            const Icon = config.icon;

            return (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={`relative flex gap-3 px-4 py-3.5 border-b border-gray-100 transition hover:bg-gray-50 cursor-pointer ${
                  notification.unread ? "bg-blue-50/40" : "bg-white"
                }`}
              >
                {/* Unread indicator */}
                {notification.unread && (
                  <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-blue-600" />
                )}

                {/* Icon */}
                <div
                  className={`shrink-0 w-9 h-9 rounded-lg ${config.bgClass} flex items-center justify-center`}
                >
                  <Icon size={17} className={config.iconClass} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-gray-900 leading-4">
                      {notification.title}
                    </p>

                    <span className="shrink-0 text-[10px] text-gray-400">
                      {timeAgo(notification.createdAt)}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] leading-4 text-gray-500">
                    {notification.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-200 bg-gray-50">
          <button className="w-full text-xs font-medium text-gray-600 hover:text-gray-900 transition cursor-pointer">
            View all activity
          </button>
        </div>
      )}
    </div>
  );
}

export default PopNotification;