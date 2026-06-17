"use client";

import React, { useState, useEffect } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Bell, Check, Trash2, Clock, Calendar, CheckSquare, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

interface NotificationItem {
  id: number | string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSimulated, setIsSimulated] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    const token = localStorage.getItem("authToken") || "";
    const isSimToken = token.startsWith("simulated-token-") || token.startsWith("google-token-") || !token;
    
    if (isSimToken) {
      setIsSimulated(true);
      try {
        const stored = localStorage.getItem("tkz_sim_notifications") || "[]";
        setNotifications(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse simulated notifications", e);
      }
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/v1/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setIsSimulated(false);
      } else {
        throw new Error("Backend response error");
      }
    } catch (err) {
      console.warn("Backend connection failed, falling back to simulated notifications:", err);
      setIsSimulated(true);
      try {
        const stored = localStorage.getItem("tkz_sim_notifications") || "[]";
        setNotifications(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse simulated notifications", e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const saveSimulated = (updated: NotificationItem[]) => {
    setNotifications(updated);
    localStorage.setItem("tkz_sim_notifications", JSON.stringify(updated));
  };

  const handleMarkAsRead = async (id: number | string) => {
    if (isSimulated) {
      const updated = notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      saveSimulated(updated);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/v1/notifications/${id}/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (isSimulated) {
      const updated = notifications.map((n) => ({ ...n, isRead: true }));
      saveSimulated(updated);
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/v1/notifications/read-all", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
      });
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (isSimulated) {
      const updated = notifications.filter((n) => n.id !== id);
      saveSimulated(updated);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/v1/notifications/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
      });
      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleClearAll = async () => {
    if (isSimulated) {
      saveSimulated([]);
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/v1/notifications/clear-all", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
      });
      if (response.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to clear all notifications:", err);
    }
  };

  const formatTimestamp = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return "Just now";
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Just now";
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#F8F9FB] text-gray-900 ${jakarta.className}`}>
      <Header />

      <main className="flex-1 max-w-[800px] mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
              <Bell className="text-blue-600 w-7 h-7" /> Notifications
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {isSimulated ? "Sandbox Simulated Mode" : "Secure Real-time Ingress Alerts"}
            </p>
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 rounded-lg transition-colors cursor-pointer"
              >
                <CheckSquare size={14} className="text-emerald-600" /> Mark All Read
              </button>
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-100 hover:bg-red-50 text-xs font-bold text-red-600 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 size={14} /> Clear All
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
              <p className="text-sm font-medium">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <Bell className="text-gray-400 w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">No alerts found</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto font-medium leading-relaxed">
                When you select seats, confirm bookings, or cancel tickets, your notifications will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const isConfirm = notification.type === "CONFIRMATION";
              return (
                <div
                  key={notification.id}
                  className={`bg-white border rounded-xl p-4 sm:p-5 flex gap-3.5 sm:gap-4 shadow-sm hover:shadow transition-all relative overflow-hidden group ${
                    notification.isRead ? "border-gray-200" : "border-l-4 border-l-blue-600 border-gray-200/80"
                  }`}
                >
                  {/* Status Indicator Icon */}
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 border ${
                    isConfirm 
                      ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                      : "bg-red-50 border-red-100 text-red-600"
                  }`}>
                    {isConfirm ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                    ) : (
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 min-w-0 pr-10">
                    <p className={`text-xs sm:text-sm font-semibold text-gray-900 leading-relaxed break-words ${
                      notification.isRead ? "text-gray-500" : "text-gray-900"
                    }`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-1.5 text-gray-400 mt-2 text-[10px] sm:text-xs font-medium">
                      <Clock size={12} />
                      <span>{formatTimestamp(notification.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions Drawer */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Mark as read"
                        className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-emerald-600 transition-colors cursor-pointer bg-white"
                      >
                        <CheckSquare size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      title="Delete notification"
                      className="w-8 h-8 rounded-lg border border-red-50 hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors cursor-pointer bg-white"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
