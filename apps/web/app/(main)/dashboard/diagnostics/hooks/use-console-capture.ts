/**
 * Console Capture Hook
 *
 * Intercepts browser console output (log, warn, error, info) and captures
 * them for display in the diagnostics dashboard. Preserves original console
 * functionality while collecting logs.
 */

import { useState, useEffect, useRef } from "react";
import type { ConsoleLog } from "../diagnostics.types";

interface UseConsoleCaptureReturn {
  consoleLogs: ConsoleLog[];
  consoleLogsRef: React.MutableRefObject<ConsoleLog[]>;
  clearConsoleLogs: () => void;
}

export function useConsoleCapture(): UseConsoleCaptureReturn {
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const consoleLogsRef = useRef<ConsoleLog[]>([]);

  useEffect(() => {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    };

    const captureLog = (type: ConsoleLog["type"]) => (...args: unknown[]) => {
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
        )
        .join(" ");

      const logEntry: ConsoleLog = {
        type,
        message,
        timestamp: Date.now(),
      };

      consoleLogsRef.current = [...consoleLogsRef.current.slice(-99), logEntry];
      setConsoleLogs(consoleLogsRef.current);

      // Call original console method
      originalConsole[type](...args);
    };

    console.log = captureLog("log");
    console.warn = captureLog("warn");
    console.error = captureLog("error");
    console.info = captureLog("info");

    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
    };
  }, []);

  const clearConsoleLogs = () => {
    consoleLogsRef.current = [];
    setConsoleLogs([]);
  };

  return {
    consoleLogs,
    consoleLogsRef,
    clearConsoleLogs,
  };
}
