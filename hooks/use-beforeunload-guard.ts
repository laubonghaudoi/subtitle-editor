"use client";

import { useEffect } from "react";

export const useBeforeUnloadGuard = (enabled: boolean) => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (enabled) {
        event.preventDefault();
        // Setting returnValue is required for most modern browsers.
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled]);
};
