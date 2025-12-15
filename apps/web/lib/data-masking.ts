/**
 * Data Masking Utility
 *
 * Provides functions to mask sensitive data (emails, IPs, phone numbers)
 * for non-superadmin users. Used to protect PII while maintaining
 * operational visibility.
 */

import { UserRole, ROLES } from './roles';

/**
 * Check if a role can view private/sensitive data
 */
export function canViewSensitiveData(role: UserRole | undefined | null): boolean {
  return role === ROLES.SUPERADMIN;
}

/**
 * Mask an email address
 * vladimir@example.com -> v*******@e******.com
 */
export function maskEmail(email: string): string {
  if (!email) return '';
  const parts = email.split('@');
  const local = parts[0];
  const domain = parts[1];
  if (!local || !domain) return '***@***.***';
  const domainParts = domain.split('.');
  const domainName = domainParts[0];
  const tld = domainParts.slice(1).join('.');
  if (!domainName) return '***@***.***';
  const maskedLocal = local[0] + '*'.repeat(Math.max(local.length - 1, 3));
  const maskedDomain = domainName[0] + '*'.repeat(Math.max(domainName.length - 1, 3));
  return `${maskedLocal}@${maskedDomain}.${tld}`;
}

/**
 * Mask an IP address
 * 192.168.1.100 -> 192.168.*.*
 * 2001:0db8:85a3::8a2e:0370:7334 -> 2001:****:****:****
 */
export function maskIP(ip: string): string {
  if (!ip) return '';

  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.*.*`;
    }
  }

  // IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 4) {
      return `${parts[0]}:****:****:****`;
    }
  }

  return '***.***.***.***';
}

/**
 * Mask a phone number
 * +1 (555) 123-4567 -> +1 (***) ***-4567
 */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  // Keep last 4 digits
  const lastFour = phone.slice(-4);
  const prefix = phone.slice(0, -4).replace(/\d/g, '*');
  return prefix + lastFour;
}

/**
 * Mask a full name
 * John Doe -> J*** D**
 */
export function maskName(name: string): string {
  if (!name) return '';
  const parts = name.split(' ');
  return parts.map(part => {
    if (part.length <= 1) return part;
    return part[0] + '*'.repeat(Math.min(part.length - 1, 3));
  }).join(' ');
}

/**
 * Mask user agent string (keep browser name, hide details)
 * Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)... -> Chrome/*** (****)
 */
export function maskUserAgent(ua: string): string {
  if (!ua) return '';

  // Extract browser name
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
  for (const browser of browsers) {
    if (ua.includes(browser)) {
      return `${browser}/*** (****)`;
    }
  }

  // Bot detection
  if (ua.toLowerCase().includes('bot') || ua.toLowerCase().includes('crawler')) {
    return 'Bot/*** (****)';
  }

  return 'Unknown/*** (****)';
}

/**
 * Interface for user data that may contain sensitive fields
 */
export interface SensitiveUserData {
  email?: string;
  ip?: string;
  ipAddress?: string;
  phone?: string;
  name?: string;
  userAgent?: string;
  [key: string]: unknown;
}

/**
 * Mask all sensitive fields in a user data object
 */
export function maskUserData<T extends SensitiveUserData>(
  data: T,
  role: UserRole | undefined | null
): T {
  if (canViewSensitiveData(role)) {
    return data;
  }

  const masked = { ...data };

  if (masked.email) {
    masked.email = maskEmail(masked.email);
  }

  if (masked.ip) {
    masked.ip = maskIP(masked.ip);
  }

  if (masked.ipAddress) {
    masked.ipAddress = maskIP(masked.ipAddress);
  }

  if (masked.phone) {
    masked.phone = maskPhone(masked.phone);
  }

  if (masked.userAgent) {
    masked.userAgent = maskUserAgent(masked.userAgent);
  }

  return masked;
}

/**
 * Mask sensitive fields in an array of objects
 */
export function maskUserDataArray<T extends SensitiveUserData>(
  dataArray: T[],
  role: UserRole | undefined | null
): T[] {
  return dataArray.map(item => maskUserData(item, role));
}
