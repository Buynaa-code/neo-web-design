"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/infrastructure/store";

type PersistApi = {
  hasHydrated?: () => boolean;
  onFinishHydration?: (callback: () => void) => () => void;
};

export function useStoreHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const store = useStore as typeof useStore & { persist?: PersistApi };
    if (store.persist?.hasHydrated?.()) {
      setHydrated(true);
      return;
    }

    const timeout = window.setTimeout(() => setHydrated(true), 0);
    const unsubscribe = store.persist?.onFinishHydration?.(() => {
      setHydrated(true);
    });

    return () => {
      window.clearTimeout(timeout);
      unsubscribe?.();
    };
  }, []);

  return hydrated;
}
