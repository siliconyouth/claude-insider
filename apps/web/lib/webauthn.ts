/**
 * WebAuthn Server-Side Utilities for Passkey Support
 *
 * ⚠️ SERVER-ONLY - Do not import in client components!
 * For client-side utilities, import from '@/lib/webauthn-client' instead.
 *
 * Handles WebAuthn configuration and credential verification using SimpleWebAuthn.
 * Works with the passkeys table defined in migrations/032_passkeys_webauthn.sql.
 *
 * @see https://simplewebauthn.dev/docs/
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type GenerateRegistrationOptionsOpts,
  type VerifyRegistrationResponseOpts,
  type GenerateAuthenticationOptionsOpts,
  type VerifyAuthenticationResponseOpts,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/types";

// Import client types and utilities for internal use and re-export
import {
  getDeviceType,
  derivePasskeyName,
  type StoredPasskey,
  type WebAuthnUser,
} from "./webauthn-client";

// Re-export for server actions that need them
export { getDeviceType, derivePasskeyName };
export type { StoredPasskey, WebAuthnUser };

/**
 * WebAuthn configuration derived from environment
 *
 * The Relying Party (RP) is your website - the party that is "relying" on the
 * authenticator to verify the user's identity. These settings must match your domain.
 */
export function getWebAuthnConfig() {
  // CRITICAL: NEXT_PUBLIC_APP_URL must be set in production for WebAuthn to work.
  // Passkeys are cryptographically bound to the rpID (domain), so using the wrong
  // domain will cause all passkey operations to fail.
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://www.claudeinsider.com"
      : "http://localhost:3001");
  const url = new URL(appUrl);

  return {
    // Relying Party ID - must be the domain (no port, no protocol)
    rpID: url.hostname,
    // Human-readable name shown in browser's passkey prompt
    rpName: "Claude Insider",
    // Origin must include protocol and port (for localhost)
    origin: url.origin,
  };
}

/**
 * Generate registration options for creating a new passkey
 *
 * Called when user clicks "Add Passkey" - returns challenge for browser's WebAuthn API.
 * The user will be prompted by their browser/OS to use Face ID, Touch ID, or security key.
 */
export async function generatePasskeyRegistrationOptions(
  user: { id: string; email: string; displayName?: string },
  existingCredentials: { credential_id: string; transports: string[] | null }[] = []
): Promise<ReturnType<typeof generateRegistrationOptions>> {
  const { rpID, rpName } = getWebAuthnConfig();

  const opts: GenerateRegistrationOptionsOpts = {
    rpName,
    rpID,
    userID: new TextEncoder().encode(user.id),
    userName: user.email,
    userDisplayName: user.displayName || user.email,
    // Don't require attestation - makes it easier for users
    attestationType: "none",
    // Prevent re-registering same authenticator
    excludeCredentials: existingCredentials.map((cred) => ({
      id: cred.credential_id, // base64url string
      transports: (cred.transports || []) as AuthenticatorTransportFuture[],
    })),
    // Preferred settings for passkey creation
    authenticatorSelection: {
      // Prefer "platform" authenticators (Face ID, Touch ID, Windows Hello)
      // but allow "cross-platform" security keys too
      authenticatorAttachment: undefined, // Allow both
      // Require user verification (biometric/PIN) - more secure
      userVerification: "preferred",
      // Request "resident" credentials that can be used without username
      // This enables the "Sign in with passkey" flow
      residentKey: "preferred",
      requireResidentKey: false,
    },
    // Algorithm preferences (Ed25519 preferred, then ES256, then RS256)
    supportedAlgorithmIDs: [-8, -7, -257],
  };

  return generateRegistrationOptions(opts);
}

/**
 * Verify registration response from browser
 *
 * Called after user completes Face ID/Touch ID - verifies the credential and
 * extracts the public key for storage.
 */
export async function verifyPasskeyRegistration(
  response: RegistrationResponseJSON,
  expectedChallenge: string
): Promise<ReturnType<typeof verifyRegistrationResponse>> {
  const { rpID, origin } = getWebAuthnConfig();

  const opts: VerifyRegistrationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: false, // Be flexible for compatibility
  };

  return verifyRegistrationResponse(opts);
}

/**
 * Generate authentication options for signing in with passkey
 *
 * Called when user clicks "Sign in with passkey" - generates challenge for authentication.
 * If credentials provided, prompts for specific passkeys; otherwise, shows all available.
 */
export async function generatePasskeyAuthenticationOptions(
  allowedCredentials?: { credential_id: string; transports: string[] | null }[]
): Promise<ReturnType<typeof generateAuthenticationOptions>> {
  const { rpID } = getWebAuthnConfig();

  const opts: GenerateAuthenticationOptionsOpts = {
    rpID,
    userVerification: "preferred",
    // If specific credentials provided, limit to those
    allowCredentials: allowedCredentials?.map((cred) => ({
      id: cred.credential_id, // base64url string
      transports: (cred.transports || []) as AuthenticatorTransportFuture[],
    })),
    // 5 minute timeout
    timeout: 300000,
  };

  return generateAuthenticationOptions(opts);
}

/**
 * Verify authentication response from browser
 *
 * Called after user completes Face ID/Touch ID for login - verifies the signature
 * and returns the new counter value (for replay attack prevention).
 */
export async function verifyPasskeyAuthentication(
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
  storedCredential: { credential_id: string; public_key: string; counter: number }
): Promise<ReturnType<typeof verifyAuthenticationResponse>> {
  const { rpID, origin } = getWebAuthnConfig();

  const opts: VerifyAuthenticationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: storedCredential.credential_id,
      publicKey: Buffer.from(storedCredential.public_key, "base64"),
      counter: storedCredential.counter,
    },
    requireUserVerification: false,
  };

  return verifyAuthenticationResponse(opts);
}
