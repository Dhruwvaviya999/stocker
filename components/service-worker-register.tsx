"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker on the client. Rendered once from the
 * root layout. Registration only runs in production-like environments where
 * the worker is served; failures are swallowed so dev is unaffected.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Avoid caching interfering with HMR during development.
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          /* no-op: SW is a progressive enhancement */
        });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
