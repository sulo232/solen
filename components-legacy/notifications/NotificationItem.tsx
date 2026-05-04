"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { de, enGB, fr, it } from "date-fns/locale";
import { NotificationType } from "@/lib/notifications";

interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  data: Record<string, any>;
}

export function NotificationItem({
  notification,
  locale = "de",
}: {
  notification: NotificationData;
  locale?: string;
}) {
  const getLocaleObj = () => {
    switch (locale) {
      case "en":
        return enGB;
      case "fr":
        return fr;
      case "it":
        return it;
      default:
        return de;
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: getLocaleObj(),
  });

  // Calculate the href based on the notification type and data attached.
  let href = "#";
  if (notification.type.startsWith("booking") && notification.data?.booking_id) {
    href = `/account/bookings/${notification.data.booking_id}`;
  } else if (notification.type.includes("review") && notification.data?.salon_slug) {
    href = `/salons/${notification.data.salon_slug}#reviews`;
  } else if (notification.type.includes("payout")) {
    href = `/dashboard/finances`;
  }

  return (
    <Link
      href={href}
      className={`block p-4 border-b border-s-ink/5 last:border-0 hover:bg-s-ink/5:bg-white/5 transition-colors ${
        !notification.read ? "bg-s-ink/[0.03]" : ""
      }`}
    >
      <div className="flex gap-3">
        {!notification.read && (
          <div className="w-2 h-2 rounded-full bg-s-blue shrink-0 mt-1.5" />
        )}
        <div className="flex-1">
          <p className={`text-sm ${!notification.read ? "font-semibold text-s-ink" : "font-medium text-s-ink/80"}`}>
            {notification.title}
          </p>
          <p className="text-sm text-s-ink/50 mt-1">{notification.body}</p>
          <p className="text-xs text-s-ink/40 mt-2">{timeAgo}</p>
        </div>
      </div>
    </Link>
  );
}
