/**
 * E2EE Key Storage
 *
 * IndexedDB-based storage for E2EE keys and sessions.
 * Uses the 'idb' library for a clean Promise-based API.
 *
 * Storage structure:
 * - account: Single entry with pickled Olm account
 * - sessions: Olm sessions keyed by recipient device ID
 * - megolmSessions: Megolm sessions keyed by conversation ID
 */

"use client";

import { openDB, type IDBPDatabase, type DBSchema } from "idb";
import type { StoredAccount, StoredSession, StoredMegolmSession } from "./types";

// ============================================================================
// DATABASE SCHEMA
// ============================================================================

const DB_NAME = "claude-insider-e2ee";
const DB_VERSION = 1;

interface E2EEDBSchema extends DBSchema {
  account: {
    key: string;
    value: StoredAccount;
  };
  sessions: {
    key: string;
    value: StoredSession;
    indexes: {
      "by-last-used": number;
      "by-recipient": string;
    };
  };
  megolmSessions: {
    key: string;
    value: StoredMegolmSession;
    indexes: {
      "by-created": number;
    };
  };
}

// ============================================================================
// DATABASE INSTANCE
// ============================================================================

let db: IDBPDatabase<E2EEDBSchema> | null = null;
let dbPromise: Promise<IDBPDatabase<E2EEDBSchema>> | null = null;

/**
 * Get or create the E2EE IndexedDB database
 */
export async function getE2EEDatabase(): Promise<IDBPDatabase<E2EEDBSchema>> {
  if (db) return db;
  if (dbPromise) return dbPromise;

  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in browser");
  }

  dbPromise = openDB<E2EEDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion, _newVersion, _transaction) {
      // Version 1: Initial schema
      if (oldVersion < 1) {
        // Account store - single entry for this device
        database.createObjectStore("account");

        // Olm sessions store - one per recipient device
        const sessionsStore = database.createObjectStore("sessions");
        sessionsStore.createIndex("by-last-used", "lastUsed");
        sessionsStore.createIndex("by-recipient", "recipientDeviceId");

        // Megolm sessions store - one per conversation
        const megolmStore = database.createObjectStore("megolmSessions");
        megolmStore.createIndex("by-created", "outboundCreatedAt");
      }
    },
    blocked() {
      console.warn("[E2EE] Database upgrade blocked - close other tabs");
    },
    blocking() {
      // Close connection to allow upgrade in another tab
      db?.close();
      db = null;
    },
    terminated() {
      console.error("[E2EE] Database connection terminated unexpectedly");
      db = null;
      dbPromise = null;
    },
  });

  db = await dbPromise;
  return db;
}

/**
 * Close the database connection
 */
export function closeE2EEDatabase(): void {
  if (db) {
    db.close();
    db = null;
    dbPromise = null;
  }
}

// ============================================================================
// ACCOUNT OPERATIONS
// ============================================================================

const ACCOUNT_KEY = "current";

/**
 * Get the stored account
 */
export async function getStoredAccount(): Promise<StoredAccount | undefined> {
  const database = await getE2EEDatabase();
  return database.get("account", ACCOUNT_KEY);
}

/**
 * Store the account
 */
export async function storeAccount(account: StoredAccount): Promise<void> {
  const database = await getE2EEDatabase();
  await database.put("account", account, ACCOUNT_KEY);
}

/**
 * Delete the stored account
 */
export async function deleteAccount(): Promise<void> {
  const database = await getE2EEDatabase();
  await database.delete("account", ACCOUNT_KEY);
}

/**
 * Check if an account exists
 */
export async function hasStoredAccount(): Promise<boolean> {
  const account = await getStoredAccount();
  return account !== undefined;
}

// ============================================================================
// OLM SESSION OPERATIONS
// ============================================================================

/**
 * Get a stored Olm session by recipient device ID
 */
export async function getOlmSession(
  recipientDeviceId: string
): Promise<StoredSession | undefined> {
  const database = await getE2EEDatabase();
  return database.get("sessions", recipientDeviceId);
}

/**
 * Store an Olm session
 */
export async function storeOlmSession(session: StoredSession): Promise<void> {
  const database = await getE2EEDatabase();
  await database.put("sessions", session, session.recipientDeviceId);
}

/**
 * Delete an Olm session
 */
export async function deleteOlmSession(recipientDeviceId: string): Promise<void> {
  const database = await getE2EEDatabase();
  await database.delete("sessions", recipientDeviceId);
}

/**
 * Get all Olm sessions
 */
export async function getAllOlmSessions(): Promise<StoredSession[]> {
  const database = await getE2EEDatabase();
  return database.getAll("sessions");
}

/**
 * Get Olm sessions sorted by last used (most recent first)
 */
export async function getRecentOlmSessions(limit: number = 10): Promise<StoredSession[]> {
  const database = await getE2EEDatabase();
  const index = database.transaction("sessions").store.index("by-last-used");
  const sessions: StoredSession[] = [];

  let cursor = await index.openCursor(null, "prev");
  while (cursor && sessions.length < limit) {
    sessions.push(cursor.value);
    cursor = await cursor.continue();
  }

  return sessions;
}

/**
 * Delete stale Olm sessions (older than maxAge)
 */
export async function deleteStaleOlmSessions(maxAgeMs: number): Promise<number> {
  const database = await getE2EEDatabase();
  const cutoff = Date.now() - maxAgeMs;
  let deleted = 0;

  const tx = database.transaction("sessions", "readwrite");
  let cursor = await tx.store.index("by-last-used").openCursor();

  while (cursor) {
    if (cursor.value.lastUsed < cutoff) {
      await cursor.delete();
      deleted++;
    }
    cursor = await cursor.continue();
  }

  await tx.done;
  return deleted;
}

// ============================================================================
// MEGOLM SESSION OPERATIONS
// ============================================================================

/**
 * Get a Megolm session for a conversation
 */
export async function getMegolmSession(
  conversationId: string
): Promise<StoredMegolmSession | undefined> {
  const database = await getE2EEDatabase();
  return database.get("megolmSessions", conversationId);
}

/**
 * Store a Megolm session
 */
export async function storeMegolmSession(
  session: StoredMegolmSession
): Promise<void> {
  const database = await getE2EEDatabase();
  await database.put("megolmSessions", session, session.conversationId);
}

/**
 * Delete a Megolm session
 */
export async function deleteMegolmSession(conversationId: string): Promise<void> {
  const database = await getE2EEDatabase();
  await database.delete("megolmSessions", conversationId);
}

/**
 * Get all Megolm sessions
 */
export async function getAllMegolmSessions(): Promise<StoredMegolmSession[]> {
  const database = await getE2EEDatabase();
  return database.getAll("megolmSessions");
}

/**
 * Add an inbound session to an existing Megolm session
 */
export async function addInboundMegolmSession(
  conversationId: string,
  sessionId: string,
  pickle: string
): Promise<void> {
  const database = await getE2EEDatabase();
  const existing = await database.get("megolmSessions", conversationId);

  if (existing) {
    existing.inboundSessions[sessionId] = pickle;
    await database.put("megolmSessions", existing, conversationId);
  } else {
    // Create new entry with only inbound session
    const newSession: StoredMegolmSession = {
      conversationId,
      outboundPickle: null,
      inboundSessions: { [sessionId]: pickle },
      outboundCreatedAt: null,
      messageCount: 0,
    };
    await database.put("megolmSessions", newSession, conversationId);
  }
}

/**
 * Increment message count and check for rotation
 */
export async function incrementMegolmMessageCount(
  conversationId: string
): Promise<{ count: number; shouldRotate: boolean }> {
  const database = await getE2EEDatabase();
  const session = await database.get("megolmSessions", conversationId);

  if (!session) {
    return { count: 0, shouldRotate: true };
  }

  session.messageCount++;
  await database.put("megolmSessions", session, conversationId);

  // Rotate after 100 messages or 1 week
  const MAX_MESSAGES = 100;
  const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

  const age = session.outboundCreatedAt
    ? Date.now() - session.outboundCreatedAt
    : 0;

  return {
    count: session.messageCount,
    shouldRotate: session.messageCount >= MAX_MESSAGES || age > MAX_AGE_MS,
  };
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Clear all E2EE data (used on logout)
 */
export async function clearAllE2EEData(): Promise<void> {
  const database = await getE2EEDatabase();

  const tx = database.transaction(
    ["account", "sessions", "megolmSessions"],
    "readwrite"
  );

  await Promise.all([
    tx.objectStore("account").clear(),
    tx.objectStore("sessions").clear(),
    tx.objectStore("megolmSessions").clear(),
    tx.done,
  ]);
}

/**
 * Export all data for backup
 */
export async function exportAllE2EEData(): Promise<{
  account: StoredAccount | undefined;
  sessions: StoredSession[];
  megolmSessions: StoredMegolmSession[];
}> {
  const database = await getE2EEDatabase();

  const [account, sessions, megolmSessions] = await Promise.all([
    database.get("account", ACCOUNT_KEY),
    database.getAll("sessions"),
    database.getAll("megolmSessions"),
  ]);

  return { account, sessions, megolmSessions };
}

/**
 * Import data from backup
 */
export async function importE2EEData(data: {
  account?: StoredAccount;
  sessions?: StoredSession[];
  megolmSessions?: StoredMegolmSession[];
}): Promise<void> {
  const database = await getE2EEDatabase();

  const tx = database.transaction(
    ["account", "sessions", "megolmSessions"],
    "readwrite"
  );

  const promises: Promise<unknown>[] = [];

  if (data.account) {
    promises.push(tx.objectStore("account").put(data.account, ACCOUNT_KEY));
  }

  if (data.sessions) {
    const sessionsStore = tx.objectStore("sessions");
    for (const session of data.sessions) {
      promises.push(sessionsStore.put(session, session.recipientDeviceId));
    }
  }

  if (data.megolmSessions) {
    const megolmStore = tx.objectStore("megolmSessions");
    for (const session of data.megolmSessions) {
      promises.push(megolmStore.put(session, session.conversationId));
    }
  }

  promises.push(tx.done);
  await Promise.all(promises);
}

// ============================================================================
// STORAGE STATS
// ============================================================================

/**
 * Get storage statistics
 */
export async function getE2EEStorageStats(): Promise<{
  hasAccount: boolean;
  sessionCount: number;
  megolmSessionCount: number;
  estimatedSizeBytes: number;
}> {
  const database = await getE2EEDatabase();

  const [account, sessionCount, megolmSessionCount] = await Promise.all([
    database.get("account", ACCOUNT_KEY),
    database.count("sessions"),
    database.count("megolmSessions"),
  ]);

  // Rough estimate: each session ~2KB, account ~4KB
  const estimatedSizeBytes =
    (account ? 4096 : 0) + sessionCount * 2048 + megolmSessionCount * 2048;

  return {
    hasAccount: account !== undefined,
    sessionCount,
    megolmSessionCount,
    estimatedSizeBytes,
  };
}
