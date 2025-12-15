"use client";

/**
 * Performance Monitoring Provider
 *
 * Initializes performance observers and provides monitoring context.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { initPerformanceObserver, createTrackedFetch } from "@/lib/monitoring";

interface PerformanceContextType {
  isMonitoring: boolean;
  metrics: Map<string, number>;
}

const PerformanceContext = createContext<PerformanceContextType>({
  isMonitoring: false,
  metrics: new Map(),
});

export function usePerformance() {
  return useContext(PerformanceContext);
}

interface PerformanceProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export function PerformanceProvider({ children, enabled = true }: PerformanceProviderProps) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics] = useState(() => new Map<string, number>());

  useEffect(() => {
    if (!enabled) return;

    // Initialize performance observer
    const cleanup = initPerformanceObserver();
     
    setIsMonitoring(true);

    // Wrap global fetch for API timing
    const originalFetch = window.fetch;
    window.fetch = createTrackedFetch(originalFetch);

    return () => {
      cleanup();
      window.fetch = originalFetch;
      setIsMonitoring(false);
    };
  }, [enabled]);

  return (
    <PerformanceContext.Provider value={{ isMonitoring, metrics }}>
      {children}
    </PerformanceContext.Provider>
  );
}
