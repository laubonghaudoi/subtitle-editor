import { useState } from "react";

type IdList = ReadonlyArray<number>;

export function useFindReplaceSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const selectIds = (ids: IdList) => {
    setSelectedIds((prev) => {
      if (prev.size === ids.length && ids.every((id) => prev.has(id))) {
        return prev;
      }

      return new Set(ids);
    });
  };

  const toggleId = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const isSelected = prev.has(id);
      if (isSelected === checked) {
        return prev;
      }

      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  };

  const clear = () => {
    setSelectedIds((prev) => {
      if (prev.size === 0) {
        return prev;
      }

      return new Set();
    });
  };

  const prune = (allowed: IdList) => {
    const allowedSet = new Set(allowed);

    setSelectedIds((prev) => {
      if (prev.size === 0) {
        return prev;
      }

      let mutated = false;
      const next = new Set<number>();

      prev.forEach((id) => {
        if (allowedSet.has(id)) {
          next.add(id);
        } else {
          mutated = true;
        }
      });

      return mutated ? next : prev;
    });
  };

  return {
    selectedIds,
    selectIds,
    toggleId,
    clear,
    prune,
  };
}
