"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useNotifications, type NotificationType, type NotificationPreferences } from "@/lib/use-notifications";

interface NotificationContextType {
  permission: NotificationPermission | "loading";
  preferences: NotificationPreferences;
  requestPermission: () => Promise<boolean>;
  updatePreference: (type: NotificationType, value: boolean) => void;
  showNotification: (title: string, body: string, tag?: string) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const notif = useNotifications();

  return (
    <NotificationContext.Provider value={notif}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return ctx;
}
