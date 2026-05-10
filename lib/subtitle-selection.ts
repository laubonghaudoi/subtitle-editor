export interface SubtitleSelectionState {
  selectedUuids: Set<string>;
  anchorUuid: string | null;
}

export interface SubtitleSelectionModifiers {
  shiftKey?: boolean;
  metaKey?: boolean;
  ctrlKey?: boolean;
}

interface ApplySubtitleSelectionOptions {
  orderedUuids: readonly string[];
  selectedUuids: Set<string>;
  anchorUuid: string | null;
  targetUuid: string;
  modifiers?: SubtitleSelectionModifiers;
}

export function applySubtitleSelectionInteraction({
  orderedUuids,
  selectedUuids,
  anchorUuid,
  targetUuid,
  modifiers,
}: ApplySubtitleSelectionOptions): SubtitleSelectionState {
  if (!orderedUuids.includes(targetUuid)) {
    return { selectedUuids, anchorUuid };
  }

  if (modifiers?.shiftKey) {
    const effectiveAnchor =
      anchorUuid && orderedUuids.includes(anchorUuid) ? anchorUuid : targetUuid;
    const anchorIndex = orderedUuids.indexOf(effectiveAnchor);
    const targetIndex = orderedUuids.indexOf(targetUuid);
    const start = Math.min(anchorIndex, targetIndex);
    const end = Math.max(anchorIndex, targetIndex);

    return {
      selectedUuids: new Set(orderedUuids.slice(start, end + 1)),
      anchorUuid: effectiveAnchor,
    };
  }

  if (modifiers?.metaKey || modifiers?.ctrlKey) {
    const next = new Set(selectedUuids);
    if (next.has(targetUuid)) {
      next.delete(targetUuid);
    } else {
      next.add(targetUuid);
    }

    return {
      selectedUuids: next,
      anchorUuid: targetUuid,
    };
  }

  return {
    selectedUuids: new Set([targetUuid]),
    anchorUuid: targetUuid,
  };
}

export function pruneSubtitleSelection(
  selectedUuids: Set<string>,
  anchorUuid: string | null,
  allowedUuids: readonly string[],
): SubtitleSelectionState {
  const allowed = new Set(allowedUuids);
  let changed = false;
  const next = new Set<string>();

  selectedUuids.forEach((uuid) => {
    if (allowed.has(uuid)) {
      next.add(uuid);
    } else {
      changed = true;
    }
  });

  const nextAnchorUuid =
    anchorUuid && allowed.has(anchorUuid) ? anchorUuid : null;

  return {
    selectedUuids: changed ? next : selectedUuids,
    anchorUuid: nextAnchorUuid,
  };
}
