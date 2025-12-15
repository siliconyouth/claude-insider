/**
 * PayPal Integration Client
 *
 * Server-side PayPal REST API client for processing donations.
 * Uses PayPal Checkout API v2 for order creation and capture.
 */

// PayPal API configuration
const PAYPAL_API_BASE = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

interface PayPalAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayPalOrderLink {
  href: string;
  rel: string;
  method: string;
}

interface PayPalOrder {
  id: string;
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
  links: PayPalOrderLink[];
}

interface PayPalCapture {
  id: string;
  status: 'COMPLETED' | 'DECLINED' | 'PARTIALLY_REFUNDED' | 'PENDING' | 'REFUNDED' | 'FAILED';
  purchase_units: Array<{
    payments: {
      captures: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    };
  }>;
  payer: {
    payer_id: string;
    email_address?: string;
    name?: {
      given_name: string;
      surname: string;
    };
  };
}

// Token cache to avoid requesting new tokens for each call
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get PayPal OAuth access token
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal auth failed: ${error}`);
  }

  const data: PayPalAccessToken = await response.json();

  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

/**
 * Create a PayPal order for donation
 */
export async function createPayPalOrder(params: {
  amount: number;
  currency: string;
  description?: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ orderId: string; approvalUrl: string }> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: params.currency,
            value: params.amount.toFixed(2),
          },
          description: params.description || 'Claude Insider Donation',
          soft_descriptor: 'CLAUDEINSIDER',
        },
      ],
      application_context: {
        brand_name: 'Claude Insider',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create PayPal order: ${error}`);
  }

  const order: PayPalOrder = await response.json();

  const approvalLink = order.links.find((link) => link.rel === 'approve');
  if (!approvalLink) {
    throw new Error('PayPal order missing approval URL');
  }

  return {
    orderId: order.id,
    approvalUrl: approvalLink.href,
  };
}

/**
 * Capture a PayPal order after user approval
 */
export async function capturePayPalOrder(orderId: string): Promise<{
  transactionId: string;
  payerId: string;
  payerEmail?: string;
  payerName?: string;
  amount: number;
  currency: string;
  status: 'completed' | 'failed' | 'pending';
}> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to capture PayPal order: ${error}`);
  }

  const capture: PayPalCapture = await response.json();

  const capturedPayment = capture.purchase_units[0]?.payments?.captures?.[0];
  if (!capturedPayment) {
    throw new Error('No capture data in PayPal response');
  }

  // Map PayPal status to our status
  let status: 'completed' | 'failed' | 'pending' = 'pending';
  if (capturedPayment.status === 'COMPLETED') {
    status = 'completed';
  } else if (capturedPayment.status === 'DECLINED' || capturedPayment.status === 'FAILED') {
    status = 'failed';
  }

  return {
    transactionId: capturedPayment.id,
    payerId: capture.payer.payer_id,
    payerEmail: capture.payer.email_address,
    payerName: capture.payer.name
      ? `${capture.payer.name.given_name} ${capture.payer.name.surname}`
      : undefined,
    amount: parseFloat(capturedPayment.amount.value),
    currency: capturedPayment.amount.currency_code,
    status,
  };
}

/**
 * Get PayPal order details (for verification)
 */
export async function getPayPalOrder(orderId: string): Promise<{
  id: string;
  status: string;
  amount: number;
  currency: string;
}> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get PayPal order: ${error}`);
  }

  const order = await response.json();
  const purchaseUnit = order.purchase_units?.[0];

  return {
    id: order.id,
    status: order.status,
    amount: parseFloat(purchaseUnit?.amount?.value || '0'),
    currency: purchaseUnit?.amount?.currency_code || 'USD',
  };
}

/**
 * Check if PayPal is properly configured
 */
export function isPayPalConfigured(): boolean {
  return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

// ============================================================================
// SUBSCRIPTION SUPPORT
// ============================================================================

interface PayPalProduct {
  id: string;
  name: string;
  description?: string;
  type: 'PHYSICAL' | 'DIGITAL' | 'SERVICE';
  category: string;
}

interface PayPalPlan {
  id: string;
  product_id: string;
  name: string;
  status: 'CREATED' | 'ACTIVE' | 'INACTIVE';
  billing_cycles: Array<{
    frequency: {
      interval_unit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
      interval_count: number;
    };
    tenure_type: 'REGULAR' | 'TRIAL';
    sequence: number;
    total_cycles: number;
    pricing_scheme: {
      fixed_price: {
        value: string;
        currency_code: string;
      };
    };
  }>;
  payment_preferences: {
    auto_bill_outstanding: boolean;
    setup_fee?: {
      value: string;
      currency_code: string;
    };
    setup_fee_failure_action: 'CONTINUE' | 'CANCEL';
    payment_failure_threshold: number;
  };
}

interface PayPalSubscription {
  id: string;
  status: 'APPROVAL_PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
  plan_id: string;
  start_time: string;
  subscriber?: {
    email_address: string;
    name?: {
      given_name: string;
      surname: string;
    };
    payer_id: string;
  };
  billing_info?: {
    next_billing_time?: string;
    last_payment?: {
      amount: {
        currency_code: string;
        value: string;
      };
      time: string;
    };
  };
  links: PayPalOrderLink[];
}

// Cached plan IDs by frequency
const planCache: Record<string, { planId: string; expiresAt: number }> = {};

/**
 * Get or create a PayPal product for donations
 */
async function getOrCreateProduct(): Promise<string> {
  const accessToken = await getAccessToken();
  const productName = 'Claude Insider Recurring Donation';

  // Try to find existing product
  const listResponse = await fetch(`${PAYPAL_API_BASE}/v1/catalogs/products?page_size=20`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (listResponse.ok) {
    const data = await listResponse.json();
    const existingProduct = data.products?.find((p: PayPalProduct) => p.name === productName);
    if (existingProduct) {
      return existingProduct.id;
    }
  }

  // Create new product
  const createResponse = await fetch(`${PAYPAL_API_BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `product-${Date.now()}`,
    },
    body: JSON.stringify({
      name: productName,
      description: 'Support Claude Insider with recurring donations',
      type: 'SERVICE',
      category: 'CHARITY',
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create PayPal product: ${error}`);
  }

  const product: PayPalProduct = await createResponse.json();
  return product.id;
}

/**
 * Get or create a billing plan for a specific amount and frequency
 */
async function getOrCreatePlan(params: {
  amount: number;
  currency: string;
  frequency: 'monthly' | 'quarterly' | 'yearly';
}): Promise<string> {
  const cacheKey = `${params.amount}-${params.currency}-${params.frequency}`;

  // Check cache (valid for 24 hours)
  if (planCache[cacheKey] && Date.now() < planCache[cacheKey].expiresAt) {
    return planCache[cacheKey].planId;
  }

  const accessToken = await getAccessToken();
  const productId = await getOrCreateProduct();

  // Map frequency to PayPal interval
  const frequencyMap = {
    monthly: { interval_unit: 'MONTH' as const, interval_count: 1 },
    quarterly: { interval_unit: 'MONTH' as const, interval_count: 3 },
    yearly: { interval_unit: 'YEAR' as const, interval_count: 1 },
  };

  const planName = `${params.currency} ${params.amount} ${params.frequency} donation`;

  // Try to find existing plan
  const listResponse = await fetch(
    `${PAYPAL_API_BASE}/v1/billing/plans?product_id=${productId}&page_size=20`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (listResponse.ok) {
    const data = await listResponse.json();
    const existingPlan = data.plans?.find((p: PayPalPlan) =>
      p.name === planName && p.status === 'ACTIVE'
    );
    if (existingPlan) {
      planCache[cacheKey] = { planId: existingPlan.id, expiresAt: Date.now() + 86400000 };
      return existingPlan.id;
    }
  }

  // Create new plan
  const createResponse = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `plan-${cacheKey}-${Date.now()}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name: planName,
      description: `${params.frequency.charAt(0).toUpperCase() + params.frequency.slice(1)} donation of ${params.currency} ${params.amount}`,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: frequencyMap[params.frequency],
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // Infinite
          pricing_scheme: {
            fixed_price: {
              value: params.amount.toFixed(2),
              currency_code: params.currency,
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create PayPal plan: ${error}`);
  }

  const plan: PayPalPlan = await createResponse.json();
  planCache[cacheKey] = { planId: plan.id, expiresAt: Date.now() + 86400000 };
  return plan.id;
}

/**
 * Create a PayPal subscription for recurring donations
 */
export async function createPayPalSubscription(params: {
  amount: number;
  currency: string;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  returnUrl: string;
  cancelUrl: string;
  subscriberEmail?: string;
  subscriberName?: string;
}): Promise<{ subscriptionId: string; approvalUrl: string }> {
  const accessToken = await getAccessToken();
  const planId = await getOrCreatePlan({
    amount: params.amount,
    currency: params.currency,
    frequency: params.frequency,
  });

  const subscriptionData: Record<string, unknown> = {
    plan_id: planId,
    application_context: {
      brand_name: 'Claude Insider',
      locale: 'en-US',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
    },
  };

  // Add subscriber info if provided
  if (params.subscriberEmail) {
    subscriptionData.subscriber = {
      email_address: params.subscriberEmail,
      name: params.subscriberName ? {
        given_name: params.subscriberName.split(' ')[0] || '',
        surname: params.subscriberName.split(' ').slice(1).join(' ') || '',
      } : undefined,
    };
  }

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `sub-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    },
    body: JSON.stringify(subscriptionData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create PayPal subscription: ${error}`);
  }

  const subscription: PayPalSubscription = await response.json();

  const approvalLink = subscription.links.find((link) => link.rel === 'approve');
  if (!approvalLink) {
    throw new Error('PayPal subscription missing approval URL');
  }

  return {
    subscriptionId: subscription.id,
    approvalUrl: approvalLink.href,
  };
}

/**
 * Get subscription details
 */
export async function getPayPalSubscription(subscriptionId: string): Promise<{
  id: string;
  status: string;
  planId: string;
  subscriberEmail?: string;
  subscriberName?: string;
  subscriberId?: string;
  nextBillingTime?: string;
  lastPaymentAmount?: number;
  lastPaymentTime?: string;
}> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get PayPal subscription: ${error}`);
  }

  const subscription: PayPalSubscription = await response.json();

  return {
    id: subscription.id,
    status: subscription.status,
    planId: subscription.plan_id,
    subscriberEmail: subscription.subscriber?.email_address,
    subscriberName: subscription.subscriber?.name
      ? `${subscription.subscriber.name.given_name} ${subscription.subscriber.name.surname}`
      : undefined,
    subscriberId: subscription.subscriber?.payer_id,
    nextBillingTime: subscription.billing_info?.next_billing_time,
    lastPaymentAmount: subscription.billing_info?.last_payment
      ? parseFloat(subscription.billing_info.last_payment.amount.value)
      : undefined,
    lastPaymentTime: subscription.billing_info?.last_payment?.time,
  };
}

/**
 * Cancel a PayPal subscription
 */
export async function cancelPayPalSubscription(
  subscriptionId: string,
  reason: string = 'Cancelled by user'
): Promise<void> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new Error(`Failed to cancel PayPal subscription: ${error}`);
  }
}

/**
 * Suspend a PayPal subscription
 */
export async function suspendPayPalSubscription(
  subscriptionId: string,
  reason: string = 'Suspended by admin'
): Promise<void> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/suspend`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new Error(`Failed to suspend PayPal subscription: ${error}`);
  }
}

/**
 * Reactivate a suspended PayPal subscription
 */
export async function reactivatePayPalSubscription(
  subscriptionId: string,
  reason: string = 'Reactivated by user'
): Promise<void> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/activate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new Error(`Failed to reactivate PayPal subscription: ${error}`);
  }
}

// ============================================================================
// WEBHOOK VERIFICATION
// ============================================================================

export interface PayPalWebhookEvent {
  id: string;
  event_version: string;
  create_time: string;
  resource_type: string;
  event_type: string;
  summary: string;
  resource: Record<string, unknown>;
  links: PayPalOrderLink[];
}

/**
 * Verify PayPal webhook signature
 *
 * Note: For full security, you should verify the webhook signature using
 * PayPal's verification endpoint. This function provides the structure
 * but requires the webhook ID from your PayPal dashboard.
 */
export async function verifyPayPalWebhook(params: {
  webhookId: string;
  headers: {
    'paypal-auth-algo': string;
    'paypal-cert-url': string;
    'paypal-transmission-id': string;
    'paypal-transmission-sig': string;
    'paypal-transmission-time': string;
  };
  body: string;
}): Promise<boolean> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: params.headers['paypal-auth-algo'],
      cert_url: params.headers['paypal-cert-url'],
      transmission_id: params.headers['paypal-transmission-id'],
      transmission_sig: params.headers['paypal-transmission-sig'],
      transmission_time: params.headers['paypal-transmission-time'],
      webhook_id: params.webhookId,
      webhook_event: JSON.parse(params.body),
    }),
  });

  if (!response.ok) {
    console.error('PayPal webhook verification failed:', await response.text());
    return false;
  }

  const result = await response.json();
  return result.verification_status === 'SUCCESS';
}

// Webhook event types we handle
export const PAYPAL_WEBHOOK_EVENTS = {
  // Subscription events
  SUBSCRIPTION_CREATED: 'BILLING.SUBSCRIPTION.CREATED',
  SUBSCRIPTION_ACTIVATED: 'BILLING.SUBSCRIPTION.ACTIVATED',
  SUBSCRIPTION_UPDATED: 'BILLING.SUBSCRIPTION.UPDATED',
  SUBSCRIPTION_EXPIRED: 'BILLING.SUBSCRIPTION.EXPIRED',
  SUBSCRIPTION_CANCELLED: 'BILLING.SUBSCRIPTION.CANCELLED',
  SUBSCRIPTION_SUSPENDED: 'BILLING.SUBSCRIPTION.SUSPENDED',
  SUBSCRIPTION_PAYMENT_FAILED: 'BILLING.SUBSCRIPTION.PAYMENT.FAILED',

  // Payment events
  PAYMENT_SALE_COMPLETED: 'PAYMENT.SALE.COMPLETED',
  PAYMENT_SALE_REFUNDED: 'PAYMENT.SALE.REFUNDED',
  PAYMENT_SALE_REVERSED: 'PAYMENT.SALE.REVERSED',

  // Capture events (for one-time donations)
  PAYMENT_CAPTURE_COMPLETED: 'PAYMENT.CAPTURE.COMPLETED',
  PAYMENT_CAPTURE_REFUNDED: 'PAYMENT.CAPTURE.REFUNDED',
} as const;
