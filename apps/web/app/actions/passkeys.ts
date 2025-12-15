"use server";

/**
 * Passkey (WebAuthn) Server Actions
 *
 * Handle passkey registration, authentication, and management.
 * Uses SimpleWebAuthn for WebAuthn operations.
 *
 * Database: passkeys, webauthn_challenges tables (migration 032)
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { pool } from "@/lib/db";
import {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
  getDeviceType,
  derivePasskeyName,
  type StoredPasskey,
} from "@/lib/webauthn";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/types";
// crypto import removed - using built-in crypto from webauthn lib

/**
 * Passkey data returned to client
 */
export interface PasskeyInfo {
  id: string;
  name: string;
  deviceType: "platform" | "cross-platform";
  backedUp: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

/**
 * Get all passkeys for the current user
 */
export async function getPasskeys(): Promise<{
  passkeys?: PasskeyInfo[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    const result = await pool.query(
      `SELECT id, passkey_name, device_type, backed_up, last_used_at, created_at
       FROM passkeys
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [session.user.id]
    );

    const passkeys: PasskeyInfo[] = result.rows.map((row) => ({
      id: row.id,
      name: row.passkey_name,
      deviceType: row.device_type as "platform" | "cross-platform",
      backedUp: row.backed_up,
      lastUsedAt: row.last_used_at,
      createdAt: row.created_at,
    }));

    return { passkeys };
  } catch (error) {
    console.error("[Passkey] Get passkeys error:", error);
    return { error: "Failed to get passkeys" };
  }
}

/**
 * Initialize passkey registration
 *
 * Returns WebAuthn options for the browser to create a credential.
 */
export async function initPasskeyRegistration(): Promise<{
  options?: PublicKeyCredentialCreationOptionsJSON;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // Get existing passkeys to exclude
    const existingResult = await pool.query(
      `SELECT credential_id, transports FROM passkeys WHERE user_id = $1`,
      [session.user.id]
    );

    const existingCredentials = existingResult.rows.map((row) => ({
      credential_id: row.credential_id,
      transports: row.transports,
    }));

    // Generate registration options
    const options = await generatePasskeyRegistrationOptions(
      {
        id: session.user.id,
        email: session.user.email,
        displayName: session.user.name || undefined,
      },
      existingCredentials
    );

    // Store the challenge for verification
    const challenge = options.challenge;
    await pool.query(
      `SELECT create_webauthn_challenge($1, NULL, $2, 'registration', 5)`,
      [session.user.id, challenge]
    );

    return { options };
  } catch (error) {
    console.error("[Passkey] Init registration error:", error);
    return { error: "Failed to start passkey registration" };
  }
}

/**
 * Complete passkey registration
 *
 * Verifies the registration response and stores the credential.
 */
export async function completePasskeyRegistration(
  credential: RegistrationResponseJSON,
  name?: string
): Promise<{
  success?: boolean;
  passkey?: PasskeyInfo;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // Decode the clientDataJSON to extract challenge
    // The clientDataJSON is base64url encoded
    const clientDataBuffer = Buffer.from(
      credential.response.clientDataJSON,
      "base64url"
    );
    // Parse but we don't need the result - verification uses stored challenge
    JSON.parse(clientDataBuffer.toString());

    // Verify challenge exists and is valid
    const storedChallengeResult = await pool.query(
      `SELECT * FROM webauthn_challenges
       WHERE user_id = $1 AND challenge_type = 'registration'
       AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [session.user.id]
    );

    if (storedChallengeResult.rows.length === 0) {
      return { error: "Registration session expired. Please try again." };
    }

    const storedChallenge = storedChallengeResult.rows[0].challenge;

    // Mark challenge as used
    await pool.query(
      `UPDATE webauthn_challenges SET used_at = NOW() WHERE id = $1`,
      [storedChallengeResult.rows[0].id]
    );

    // Verify the registration
    const verification = await verifyPasskeyRegistration(
      credential,
      storedChallenge
    );

    if (!verification.verified || !verification.registrationInfo) {
      return { error: "Passkey verification failed. Please try again." };
    }

    const { registrationInfo } = verification;

    // Determine device type and derive name
    const deviceType = getDeviceType(
      registrationInfo.credentialDeviceType,
      credential.response.transports
    );

    const derivedName = name || derivePasskeyName(
      deviceType,
      credential.response.transports,
      registrationInfo.aaguid
    );

    // Store the passkey
    const credentialId = Buffer.from(registrationInfo.credential.id).toString("base64url");
    const publicKey = Buffer.from(registrationInfo.credential.publicKey).toString("base64");

    const insertResult = await pool.query(
      `INSERT INTO passkeys (
         user_id, credential_id, public_key, counter, device_type,
         backed_up, transports, passkey_name, aaguid
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, passkey_name, device_type, backed_up, last_used_at, created_at`,
      [
        session.user.id,
        credentialId,
        publicKey,
        registrationInfo.credential.counter,
        deviceType,
        registrationInfo.credentialBackedUp,
        credential.response.transports || [],
        derivedName,
        registrationInfo.aaguid || null,
      ]
    );

    const passkey = insertResult.rows[0];

    return {
      success: true,
      passkey: {
        id: passkey.id,
        name: passkey.passkey_name,
        deviceType: passkey.device_type,
        backedUp: passkey.backed_up,
        lastUsedAt: passkey.last_used_at,
        createdAt: passkey.created_at,
      },
    };
  } catch (error) {
    console.error("[Passkey] Complete registration error:", error);
    return { error: "Failed to complete passkey registration" };
  }
}

/**
 * Initialize passkey authentication
 *
 * Returns WebAuthn options for signing in with a passkey.
 * If email provided, limits to that user's passkeys.
 */
export async function initPasskeyAuth(email?: string): Promise<{
  options?: PublicKeyCredentialRequestOptionsJSON;
  error?: string;
}> {
  try {
    let allowedCredentials: Pick<StoredPasskey, "credential_id" | "transports">[] | undefined;

    // If email provided, get that user's passkeys
    if (email) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = (await createAdminClient()) as any;

      const { data: user } = await supabase
        .from("user")
        .select("id")
        .eq("email", email.toLowerCase())
        .single();

      if (user) {
        const result = await pool.query(
          `SELECT credential_id, transports FROM passkeys WHERE user_id = $1`,
          [user.id]
        );
        allowedCredentials = result.rows;
      }
    }

    // Generate authentication options
    const options = await generatePasskeyAuthenticationOptions(allowedCredentials);

    // Store the challenge
    await pool.query(
      `INSERT INTO webauthn_challenges (email, challenge, challenge_type, expires_at)
       VALUES ($1, $2, 'authentication', NOW() + INTERVAL '5 minutes')`,
      [email?.toLowerCase() || null, options.challenge]
    );

    return { options };
  } catch (error) {
    console.error("[Passkey] Init auth error:", error);
    return { error: "Failed to start passkey authentication" };
  }
}

/**
 * Complete passkey authentication
 *
 * Verifies the authentication response and returns user info.
 */
export async function completePasskeyAuth(
  credential: AuthenticationResponseJSON
): Promise<{
  success?: boolean;
  userId?: string;
  email?: string;
  error?: string;
}> {
  try {
    // Decode clientDataJSON to get the challenge
    const clientDataBuffer = Buffer.from(
      credential.response.clientDataJSON,
      "base64url"
    );
    const clientData = JSON.parse(clientDataBuffer.toString());

    // Find the stored challenge
    const challengeResult = await pool.query(
      `SELECT * FROM webauthn_challenges
       WHERE challenge = $1 AND challenge_type = 'authentication'
       AND used_at IS NULL AND expires_at > NOW()
       LIMIT 1`,
      [clientData.challenge]
    );

    if (challengeResult.rows.length === 0) {
      return { error: "Authentication session expired. Please try again." };
    }

    // Mark challenge as used
    await pool.query(
      `UPDATE webauthn_challenges SET used_at = NOW() WHERE id = $1`,
      [challengeResult.rows[0].id]
    );

    // Find the passkey by credential ID
    const credentialId = credential.id;
    const passkeyResult = await pool.query(
      `SELECT p.*, u.email
       FROM passkeys p
       JOIN "user" u ON p.user_id = u.id
       WHERE p.credential_id = $1`,
      [credentialId]
    );

    if (passkeyResult.rows.length === 0) {
      return { error: "Passkey not found. Please try another method." };
    }

    const passkey = passkeyResult.rows[0];

    // Verify the authentication
    const verification = await verifyPasskeyAuthentication(
      credential,
      clientData.challenge,
      {
        credential_id: passkey.credential_id,
        public_key: passkey.public_key,
        counter: passkey.counter,
      }
    );

    if (!verification.verified) {
      return { error: "Passkey verification failed. Please try again." };
    }

    // Update the counter and last used
    await pool.query(
      `UPDATE passkeys
       SET counter = $1, last_used_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [verification.authenticationInfo.newCounter, passkey.id]
    );

    return {
      success: true,
      userId: passkey.user_id,
      email: passkey.email,
    };
  } catch (error) {
    console.error("[Passkey] Complete auth error:", error);
    return { error: "Failed to complete passkey authentication" };
  }
}

/**
 * Rename a passkey
 */
export async function renamePasskey(
  passkeyId: string,
  newName: string
): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    if (!newName.trim()) {
      return { error: "Name cannot be empty" };
    }

    if (newName.length > 100) {
      return { error: "Name is too long (max 100 characters)" };
    }

    const result = await pool.query(
      `UPDATE passkeys
       SET passkey_name = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id`,
      [newName.trim(), passkeyId, session.user.id]
    );

    if (result.rows.length === 0) {
      return { error: "Passkey not found" };
    }

    return { success: true };
  } catch (error) {
    console.error("[Passkey] Rename error:", error);
    return { error: "Failed to rename passkey" };
  }
}

/**
 * Remove a passkey
 */
export async function removePasskey(passkeyId: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // Allow removal even if it's the last passkey (they still have email/password)
    // The UI warns the user about this

    const result = await pool.query(
      `DELETE FROM passkeys WHERE id = $1 AND user_id = $2 RETURNING id`,
      [passkeyId, session.user.id]
    );

    if (result.rows.length === 0) {
      return { error: "Passkey not found" };
    }

    return { success: true };
  } catch (error) {
    console.error("[Passkey] Remove error:", error);
    return { error: "Failed to remove passkey" };
  }
}

/**
 * Check if user has any passkeys registered
 */
export async function checkUserHasPasskeys(email: string): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data: user } = await supabase
      .from("user")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (!user) return false;

    const result = await pool.query(
      `SELECT EXISTS(SELECT 1 FROM passkeys WHERE user_id = $1) as has_passkeys`,
      [user.id]
    );

    return result.rows[0]?.has_passkeys || false;
  } catch {
    return false;
  }
}

/**
 * Get passkey count for current user
 */
export async function getPasskeyCount(): Promise<number> {
  try {
    const session = await getSession();
    if (!session?.user?.id) return 0;

    const result = await pool.query(
      `SELECT COUNT(*) as count FROM passkeys WHERE user_id = $1`,
      [session.user.id]
    );

    return parseInt(result.rows[0]?.count || "0");
  } catch {
    return 0;
  }
}
