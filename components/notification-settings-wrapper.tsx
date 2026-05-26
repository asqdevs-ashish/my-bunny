"use client";

import { NotificationSettings } from "@/components/notification-settings";
import { useNotificationContext } from "@/components/notification-provider";

export function NotificationSettingsWrapper() {
  const { permission, preferences, requestPermission, updatePreference, webPushSubscribed, testNotification } =
    useNotificationContext();

  return (
    <NotificationSettings
      permission={permission}
      preferences={preferences}
      requestPermission={requestPermission}
      updatePreference={updatePreference}
      webPushSubscribed={webPushSubscribed}
      testNotification={testNotification}
    />
  );
}
