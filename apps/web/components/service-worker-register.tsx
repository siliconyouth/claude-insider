"use client";

import { useEffect } from "react";
import { InstallPrompt } from "./pwa/install-prompt";
import { OfflineIndicator } from "./pwa/offline-indicator";
import { UpdateNotification } from "./pwa/update-notification";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  return (
    <>
      <InstallPrompt />
      <OfflineIndicator />
      <UpdateNotification />
    </>
  );
}
