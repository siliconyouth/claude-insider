/**
 * Security Realtime Hook
 *
 * Subscribes to Supabase Realtime for live security events.
 * Provides real-time updates for security logs and visitor changes.
 */

"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// Security log entry from database
export interface SecurityLogEntry {
  id: string;
  request_id: string;
  visitor_id: string | null;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  endpoint: string | null;
  method: string | null;
  is_bot: boolean;
  is_verified_bot: boolean;
  bot_name: string | null;
  bot_category: string | null;
  fingerprint_confidence: number | null;
  event_type: string;
  severity: string;
  status_code: number | null;
  response_time_ms: number | null;
  honeypot_served: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// Visitor fingerprint entry from database
export interface VisitorEntry {
  id: string;
  visitor_id: string;
  first_seen_at: string;
  last_seen_at: string;
  total_requests: number;
  bot_requests: number;
  human_requests: number;
  honeypot_triggers: number;
  trust_score: number;
  is_blocked: boolean;
  block_reason: string | null;
  blocked_at: string | null;
  linked_user_id: string | null;
  updated_at: string;
}

export interface SecurityRealtimeState {
  // Recent security logs (last 50)
  recentLogs: SecurityLogEntry[];
  // Recent visitor updates
  recentVisitors: VisitorEntry[];
  // Connection status
  isConnected: boolean;
  // Error state
  error: Error | null;
  // Stats counters (updated in real-time)
  stats: {
    newLogsCount: number;
    botDetections: number;
    honeypotTriggers: number;
    visitorUpdates: number;
  };
}

export interface UseSecurityRealtimeOptions {
  // Maximum number of logs to keep in memory
  maxLogs?: number;
  // Maximum number of visitors to keep in memory
  maxVisitors?: number;
  // Auto-connect on mount
  autoConnect?: boolean;
  // Callback when new log arrives
  onNewLog?: (log: SecurityLogEntry) => void;
  // Callback when visitor is updated
  onVisitorUpdate?: (visitor: VisitorEntry) => void;
}

const DEFAULT_OPTIONS: Required<UseSecurityRealtimeOptions> = {
  maxLogs: 50,
  maxVisitors: 20,
  autoConnect: true,
  onNewLog: () => {},
  onVisitorUpdate: () => {},
};

/**
 * Hook for real-time security event subscriptions
 */
export function useSecurityRealtime(
  options: UseSecurityRealtimeOptions = {}
): SecurityRealtimeState & {
  connect: () => void;
  disconnect: () => void;
  clearLogs: () => void;
  clearStats: () => void;
} {
  const opts = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    [options]
  );

  const [recentLogs, setRecentLogs] = useState<SecurityLogEntry[]>([]);
  const [recentVisitors, setRecentVisitors] = useState<VisitorEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState({
    newLogsCount: 0,
    botDetections: 0,
    honeypotTriggers: 0,
    visitorUpdates: 0,
  });

  const logsChannelRef = useRef<RealtimeChannel | null>(null);
  const visitorsChannelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  // Handle new security log
  const handleNewLog = useCallback(
    (payload: { new: SecurityLogEntry }) => {
      const log = payload.new;

      setRecentLogs((prev) => {
        const updated = [log, ...prev];
        return updated.slice(0, opts.maxLogs);
      });

      setStats((prev) => ({
        ...prev,
        newLogsCount: prev.newLogsCount + 1,
        botDetections: log.is_bot ? prev.botDetections + 1 : prev.botDetections,
        honeypotTriggers: log.honeypot_served
          ? prev.honeypotTriggers + 1
          : prev.honeypotTriggers,
      }));

      opts.onNewLog(log);
    },
    [opts]
  );

  // Handle visitor update
  const handleVisitorUpdate = useCallback(
    (visitor: VisitorEntry) => {
      setRecentVisitors((prev) => {
        // Update existing or add new
        const existingIndex = prev.findIndex(
          (v) => v.visitor_id === visitor.visitor_id
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = visitor;
          return updated;
        }
        const updated = [visitor, ...prev];
        return updated.slice(0, opts.maxVisitors);
      });

      setStats((prev) => ({
        ...prev,
        visitorUpdates: prev.visitorUpdates + 1,
      }));

      opts.onVisitorUpdate(visitor);
    },
    [opts]
  );

  // Connect to Realtime
  const connect = useCallback(() => {
    if (logsChannelRef.current) {
      return; // Already connected
    }

    try {
      const supabase = supabaseRef.current;

      // Channel for security logs
      const logsChannel = supabase
        .channel("security-logs")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "security_logs",
          },
          (payload: { new: Record<string, unknown> }) => {
            handleNewLog({ new: payload.new as unknown as SecurityLogEntry });
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setIsConnected(true);
            setError(null);
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            setIsConnected(false);
            if (status === "CHANNEL_ERROR") {
              setError(new Error("Realtime channel error"));
            }
          }
        });

      logsChannelRef.current = logsChannel;

      // Channel for visitor fingerprints
      const visitorsChannel = supabase
        .channel("security-visitors")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "visitor_fingerprints",
          },
          (payload: { new: Record<string, unknown> }) => {
            handleVisitorUpdate(payload.new as unknown as VisitorEntry);
          }
        )
        .subscribe();

      visitorsChannelRef.current = visitorsChannel;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Connection failed"));
      setIsConnected(false);
    }
  }, [handleNewLog, handleVisitorUpdate]);

  // Disconnect from Realtime
  const disconnect = useCallback(() => {
    const supabase = supabaseRef.current;
    if (logsChannelRef.current) {
      supabase.removeChannel(logsChannelRef.current);
      logsChannelRef.current = null;
    }
    if (visitorsChannelRef.current) {
      supabase.removeChannel(visitorsChannelRef.current);
      visitorsChannelRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Clear logs
  const clearLogs = useCallback(() => {
    setRecentLogs([]);
  }, []);

  // Clear stats
  const clearStats = useCallback(() => {
    setStats({
      newLogsCount: 0,
      botDetections: 0,
      honeypotTriggers: 0,
      visitorUpdates: 0,
    });
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (opts.autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [opts.autoConnect, connect, disconnect]);

  return {
    recentLogs,
    recentVisitors,
    isConnected,
    error,
    stats,
    connect,
    disconnect,
    clearLogs,
    clearStats,
  };
}

/**
 * Hook for just the connection status indicator
 */
export function useSecurityRealtimeStatus(): {
  isConnected: boolean;
  error: Error | null;
} {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Need at least one listener for the channel to work
    const channel = supabase
      .channel("security-status")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "security_logs",
        },
        () => {
          // Just for connection status - no-op handler
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
        if (status === "CHANNEL_ERROR") {
          setError(new Error("Connection error"));
        } else {
          setError(null);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return { isConnected, error };
}
