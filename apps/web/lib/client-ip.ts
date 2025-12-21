/**
 * Client IP Utilities
 *
 * Extracts the real client IP address from various proxy headers.
 * Handles Vercel, Cloudflare, and standard proxy configurations.
 */

import { NextRequest } from "next/server";

/**
 * Get the real client IP address from request headers
 *
 * Checks headers in order of preference:
 * 1. x-real-ip (Vercel)
 * 2. x-forwarded-for (Standard proxy header)
 * 3. cf-connecting-ip (Cloudflare)
 */
export function getClientIP(request: NextRequest): string {
  // Vercel injects this header
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Standard proxy header - first IP is the client
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIP = forwardedFor.split(",")[0]?.trim();
    if (firstIP) {
      return firstIP;
    }
  }

  // Cloudflare header
  const cfIP = request.headers.get("cf-connecting-ip");
  if (cfIP) {
    return cfIP;
  }

  // Fallback
  return "unknown";
}

/**
 * Anonymize an IP address for privacy
 * Removes the last octet for IPv4 or last 80 bits for IPv6
 */
export function anonymizeIP(ip: string): string {
  if (ip === "unknown") return ip;

  // IPv4: Replace last octet with 0
  if (ip.includes(".") && !ip.includes(":")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      parts[3] = "0";
      return parts.join(".");
    }
  }

  // IPv6: Replace last 5 groups with zeros
  if (ip.includes(":")) {
    const parts = ip.split(":");
    if (parts.length >= 4) {
      // Keep first 3 groups, zero the rest
      return parts.slice(0, 3).join(":") + ":0:0:0:0:0";
    }
  }

  return ip;
}

/**
 * Check if an IP is a private/local address
 */
export function isPrivateIP(ip: string): boolean {
  if (ip === "unknown" || ip === "localhost") return true;

  // IPv4 private ranges
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("172.")) {
    const secondOctet = parseInt(ip.split(".")[1] || "0", 10);
    if (secondOctet >= 16 && secondOctet <= 31) return true;
  }
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("127.")) return true;

  // IPv6 private/local
  if (ip.startsWith("::1")) return true;
  if (ip.toLowerCase().startsWith("fc") || ip.toLowerCase().startsWith("fd")) return true;
  if (ip.toLowerCase().startsWith("fe80")) return true;

  return false;
}
