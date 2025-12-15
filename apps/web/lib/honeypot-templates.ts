/**
 * Honeypot Templates Library
 *
 * Pre-generated fake data for honeypot responses.
 * Uses templates for common patterns, with AI fallback for unknown endpoints.
 */

import { faker } from "@faker-js/faker";

// Seed faker for reproducible results in tests
// faker.seed(12345);

/**
 * Generate a list of fake users
 */
export function generateFakeUsers(count: number = 50): FakeUser[] {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    role: faker.helpers.arrayElement(["user", "admin", "moderator"]),
    createdAt: faker.date.past().toISOString(),
    lastLogin: faker.date.recent().toISOString(),
    isActive: faker.datatype.boolean(),
  }));
}

/**
 * Generate fake API documentation
 */
export function generateFakeApiDocs(): FakeApiDoc[] {
  return [
    {
      endpoint: "/api/v1/users",
      method: "GET",
      description: "Retrieve all users",
      parameters: [
        { name: "page", type: "number", required: false },
        { name: "limit", type: "number", required: false },
      ],
      response: { users: [], total: 0, page: 1 },
    },
    {
      endpoint: "/api/v1/users/:id",
      method: "GET",
      description: "Retrieve a single user by ID",
      parameters: [{ name: "id", type: "string", required: true }],
      response: { user: {} },
    },
    {
      endpoint: "/api/v1/auth/login",
      method: "POST",
      description: "Authenticate user",
      parameters: [
        { name: "email", type: "string", required: true },
        { name: "password", type: "string", required: true },
      ],
      response: { token: "", expiresAt: "" },
    },
    {
      endpoint: "/api/v1/posts",
      method: "GET",
      description: "Retrieve blog posts",
      parameters: [
        { name: "category", type: "string", required: false },
        { name: "author", type: "string", required: false },
      ],
      response: { posts: [], total: 0 },
    },
  ];
}

/**
 * Generate fake blog posts
 */
export function generateFakePosts(count: number = 20): FakePost[] {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    slug: faker.lorem.slug(),
    excerpt: faker.lorem.paragraph(),
    content: faker.lorem.paragraphs(5),
    author: {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      avatar: faker.image.avatar(),
    },
    category: faker.helpers.arrayElement([
      "Technology",
      "AI",
      "Programming",
      "News",
    ]),
    tags: faker.helpers.arrayElements(
      ["javascript", "python", "ai", "ml", "web", "cloud"],
      { min: 2, max: 4 }
    ),
    publishedAt: faker.date.past().toISOString(),
    readTime: faker.number.int({ min: 3, max: 15 }),
    views: faker.number.int({ min: 100, max: 50000 }),
  }));
}

/**
 * Generate fake products
 */
export function generateFakeProducts(count: number = 30): FakeProduct[] {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: parseFloat(faker.commerce.price({ min: 10, max: 500 })),
    currency: "USD",
    category: faker.commerce.department(),
    sku: faker.string.alphanumeric(8).toUpperCase(),
    inStock: faker.datatype.boolean(),
    stockCount: faker.number.int({ min: 0, max: 1000 }),
    image: faker.image.url(),
    rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
    reviewCount: faker.number.int({ min: 0, max: 500 }),
  }));
}

/**
 * Generate fake analytics data
 */
export function generateFakeAnalytics(): FakeAnalytics {
  return {
    totalVisitors: faker.number.int({ min: 10000, max: 1000000 }),
    uniqueVisitors: faker.number.int({ min: 5000, max: 500000 }),
    pageViews: faker.number.int({ min: 50000, max: 5000000 }),
    bounceRate: faker.number.float({ min: 20, max: 80, fractionDigits: 1 }),
    avgSessionDuration: faker.number.int({ min: 60, max: 600 }),
    topPages: Array.from({ length: 10 }, () => ({
      path: `/${faker.lorem.slug()}`,
      views: faker.number.int({ min: 1000, max: 100000 }),
    })),
    trafficSources: [
      { source: "Direct", visits: faker.number.int({ min: 1000, max: 50000 }) },
      { source: "Google", visits: faker.number.int({ min: 5000, max: 200000 }) },
      { source: "Social", visits: faker.number.int({ min: 500, max: 30000 }) },
      { source: "Referral", visits: faker.number.int({ min: 200, max: 10000 }) },
    ],
    countries: Array.from({ length: 20 }, () => ({
      code: faker.location.countryCode(),
      name: faker.location.country(),
      visitors: faker.number.int({ min: 100, max: 50000 }),
    })),
  };
}

/**
 * Generate fake configuration/settings
 */
export function generateFakeSettings(): FakeSettings {
  return {
    site: {
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
      url: faker.internet.url(),
      logo: faker.image.url(),
      favicon: faker.image.url(),
    },
    features: {
      authentication: true,
      twoFactorAuth: faker.datatype.boolean(),
      socialLogin: faker.datatype.boolean(),
      emailVerification: true,
      apiAccess: faker.datatype.boolean(),
    },
    limits: {
      maxFileSize: faker.number.int({ min: 5, max: 100 }) * 1024 * 1024,
      maxRequestsPerMinute: faker.number.int({ min: 60, max: 1000 }),
      maxUsersPerOrg: faker.number.int({ min: 5, max: 100 }),
    },
    integrations: {
      stripe: { enabled: faker.datatype.boolean(), mode: "test" },
      sendgrid: { enabled: faker.datatype.boolean() },
      slack: { enabled: faker.datatype.boolean() },
    },
  };
}

/**
 * Generate fake error response
 */
export function generateFakeError(statusCode: number = 500): FakeError {
  const errors: Record<number, { message: string; code: string }> = {
    400: { message: "Bad Request", code: "INVALID_REQUEST" },
    401: { message: "Unauthorized", code: "AUTH_REQUIRED" },
    403: { message: "Forbidden", code: "ACCESS_DENIED" },
    404: { message: "Not Found", code: "RESOURCE_NOT_FOUND" },
    429: { message: "Too Many Requests", code: "RATE_LIMITED" },
    500: { message: "Internal Server Error", code: "SERVER_ERROR" },
    503: { message: "Service Unavailable", code: "SERVICE_DOWN" },
  };

  const error = errors[statusCode] ?? errors[500] ?? { message: "Error", code: "ERROR" };

  return {
    error: {
      message: error.message,
      code: error.code,
      statusCode,
      requestId: faker.string.uuid(),
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Generate fake paginated response wrapper
 */
export function wrapInPagination<T>(
  data: T[],
  options: { page?: number; limit?: number; total?: number } = {}
): PaginatedResponse<T> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const total = options.total || data.length * 10;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    },
  };
}

/**
 * Get fake response based on endpoint pattern
 */
export function getFakeResponseForEndpoint(
  endpoint: string,
  method: string = "GET"
): unknown {
  // Normalize endpoint
  const path = endpoint.toLowerCase().replace(/\/$/, "");

  // Match against patterns
  if (path.includes("/users")) {
    if (method === "GET") {
      return wrapInPagination(generateFakeUsers(20));
    }
    if (method === "POST") {
      return { user: generateFakeUsers(1)[0], message: "User created" };
    }
  }

  if (path.includes("/posts") || path.includes("/articles")) {
    return wrapInPagination(generateFakePosts(10));
  }

  if (path.includes("/products") || path.includes("/items")) {
    return wrapInPagination(generateFakeProducts(15));
  }

  if (path.includes("/analytics") || path.includes("/stats")) {
    return generateFakeAnalytics();
  }

  if (path.includes("/settings") || path.includes("/config")) {
    return generateFakeSettings();
  }

  if (path.includes("/docs") || path.includes("/api-docs")) {
    return { endpoints: generateFakeApiDocs() };
  }

  if (path.includes("/auth/login") || path.includes("/auth/signin")) {
    return {
      token: faker.string.alphanumeric(64),
      refreshToken: faker.string.alphanumeric(64),
      expiresIn: 3600,
      user: generateFakeUsers(1)[0],
    };
  }

  if (path.includes("/auth/register") || path.includes("/auth/signup")) {
    return {
      message: "Registration successful",
      user: generateFakeUsers(1)[0],
      verificationEmailSent: true,
    };
  }

  if (path.includes("/search")) {
    return {
      results: generateFakePosts(5).map((p) => ({
        type: "post",
        id: p.id,
        title: p.title,
        excerpt: p.excerpt,
      })),
      total: faker.number.int({ min: 50, max: 500 }),
      query: "search term",
    };
  }

  // Default: generic API response
  return {
    success: true,
    data: {
      id: faker.string.uuid(),
      message: "Operation completed successfully",
      timestamp: new Date().toISOString(),
    },
  };
}

// Types
export interface FakeUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
}

export interface FakeApiDoc {
  endpoint: string;
  method: string;
  description: string;
  parameters: Array<{ name: string; type: string; required: boolean }>;
  response: unknown;
}

export interface FakePost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: { id: string; name: string; avatar: string };
  category: string;
  tags: string[];
  publishedAt: string;
  readTime: number;
  views: number;
}

export interface FakeProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  sku: string;
  inStock: boolean;
  stockCount: number;
  image: string;
  rating: number;
  reviewCount: number;
}

export interface FakeAnalytics {
  totalVisitors: number;
  uniqueVisitors: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: Array<{ path: string; views: number }>;
  trafficSources: Array<{ source: string; visits: number }>;
  countries: Array<{ code: string; name: string; visitors: number }>;
}

export interface FakeSettings {
  site: {
    name: string;
    description: string;
    url: string;
    logo: string;
    favicon: string;
  };
  features: Record<string, boolean>;
  limits: Record<string, number>;
  integrations: Record<string, { enabled: boolean; mode?: string }>;
}

export interface FakeError {
  error: {
    message: string;
    code: string;
    statusCode: number;
    requestId: string;
    timestamp: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
}
