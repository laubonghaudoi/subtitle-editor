"use client";

import type { BulkOffsetPreviewState } from "@/components/bulk-offset/drawer";
import { useEffect, useState } from "react";

interface UseBulkOffsetStateOptions {
  trackCount: number;
  disabled: boolean;
}

export const useBulkOffsetState = ({
  trackCount,
  disabled,
}: UseBulkOffsetStateOptions) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [preview, setPreview] = useState<
    Record<string, BulkOffsetPreviewState>
  >({});

  useEffect(() => {
    if (trackCount === 0) {
      setIsOpen(false);
    }
  }, [trackCount]);

  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false);
    }
  }, [disabled, isOpen]);

  const toggle = () => {
    setIsOpen((previous) => !previous);
  };

  return {
    isBulkOffsetOpen: isOpen,
    setIsBulkOffsetOpen: setIsOpen,
    toggleBulkOffset: toggle,
    bulkOffsetPreview: preview,
    setBulkOffsetPreview: setPreview,
  };
};
