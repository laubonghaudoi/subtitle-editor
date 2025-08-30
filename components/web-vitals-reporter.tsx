"use client";

import { reportWebVitals } from "@/lib/analytics";
import { useEffect } from "react";

export default function WebVitalsReporter() {
  useEffect(() => {
    reportWebVitals();
  }, []);
  
  return null;
}
