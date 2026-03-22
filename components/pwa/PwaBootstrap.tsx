"use client";

import { useEffect } from "react";

export function PwaBootstrap(): null {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    const registerServiceWorker = async (): Promise<void> => {
      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
      } catch {
        return;
      }
    };

    void registerServiceWorker();
  }, []);

  return null;
}
