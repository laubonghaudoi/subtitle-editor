import { useState } from "react";

const MAX_HISTORY_LENGTH = 50;

interface History<T> {
  past: T[];
  present: T;
  future: T[];
}

// Type for the action passed to the state setter, similar to React's useState setter
type SetStateAction<T> = T | ((prevState: T) => T);

/**
 * A custom hook to manage state with undo/redo capabilities.
 * @param initialState The initial state value.
 * @returns A tuple containing:
 *  - The current state.
 *  - A function to set the state (tracks history).
 *  - An undo function.
 *  - A redo function.
 *  - A boolean indicating if undo is possible.
 *  - A boolean indicating if redo is possible.
 */
export function useUndoableState<T>(
  initialState: T
): [
  T,
  (newState: SetStateAction<T>) => void,
  () => void,
  () => void,
  boolean,
  boolean
] {
  const [history, setHistory] = useState<History<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // State setter function that updates history
  const setState = (action: SetStateAction<T>) => {
    setHistory((currentHistory) => {
      const previousPresent = currentHistory.present;
      // Calculate the new present state based on the action
      const newPresent =
        typeof action === "function"
          ? (action as (prevState: T) => T)(previousPresent)
          : action;

      // If the new state is the same as the current state, do nothing
      // Using JSON.stringify for simple deep comparison; consider a library for complex objects if needed
      if (JSON.stringify(previousPresent) === JSON.stringify(newPresent)) {
        return currentHistory;
      }

      // Add the previous present state to the past and trim it if it grows
      // beyond the configured limit to avoid unbounded memory usage
      const newPast = [...currentHistory.past, previousPresent].slice(-MAX_HISTORY_LENGTH);

      return {
        past: newPast,
        present: newPresent,
        future: [], // Clear future history on new state change
      };
    });
  };

  // Undo function
  const undo = () => {
    if (!canUndo) return; // Do nothing if there's no past state

    setHistory((currentHistory) => {
      const { past, present, future } = currentHistory;
      const previous = past[past.length - 1]; // Get the last state from the past
      const newPast = past.slice(0, past.length - 1); // Remove the last state from the past
      const newFuture = [present, ...future]; // Add the current state to the future

      return {
        past: newPast,
        present: previous, // Set the present state to the previous one
        future: newFuture,
      };
    });
  };

  // Redo function
  const redo = () => {
    if (!canRedo) return; // Do nothing if there's no future state

    setHistory((currentHistory) => {
      const { past, present, future } = currentHistory;
      const next = future[0]; // Get the next state from the future
      const newFuture = future.slice(1); // Remove the next state from the future
      // Add the current state to the past and trim history to avoid excessive memory usage
      const newPast = [...past, present].slice(-MAX_HISTORY_LENGTH);

      return {
        past: newPast,
        present: next, // Set the present state to the next one
        future: newFuture,
      };
    });
  };

  // Return the state, setter, undo/redo functions, and flags
  return [history.present, setState, undo, redo, canUndo, canRedo];
}
