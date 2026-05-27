"use client";

import { NotificationSettings } from "@/components/notification-settings";
import { useNotificationContext } from "@/components/notification-provider";

export function NotificationSettingsWrapper() {
  const { permission, preferences, requestPermission, updatePreference, webPushSubscribed, testAllNotifications, testDelayedNotification } =
    useNotificationContext();

  return (
    <NotificationSettings
      permission={permission}
      preferences={preferences}
      requestPermission={requestPermission}
      updatePreference={updatePreference}
      webPushSubscribed={webPushSubscribed}
      testAllNotifications={testAllNotifications}
      testDelayedNotification={testDelayedNotification}
    />
  );
}
