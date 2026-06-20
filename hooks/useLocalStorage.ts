import { useSyncExternalStore, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // 1. Subscribe to storage changes (supports cross-tab sync)
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
  }, []);

  // 2. Read the current value from LocalStorage
  // We read the raw string to ensure referential stability for useSyncExternalStore
  const getSnapshot = () => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  };

  // 3. Return the server-side snapshot (always null/default to match server HTML)
  const getServerSnapshot = () => null;

  // 4. Use the hook to sync
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // 5. Parse the value (or use initialValue if null/error)
  const value: T = (() => {
    if (store === null) return initialValue;
    try {
      return JSON.parse(store);
    } catch {
      return initialValue;
    }
  })();

  // 6. Setter function that updates storage and notifies listeners
  const setValue = useCallback(
    (newValue: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          newValue instanceof Function ? newValue(value) : newValue;

        window.localStorage.setItem(key, JSON.stringify(valueToStore));

        // Dispatch a storage event so this hook updates in the CURRENT tab too
        // (Native 'storage' event only fires for other tabs)
        window.dispatchEvent(new Event("storage"));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, value],
  );

  return [value, setValue] as const;
}
