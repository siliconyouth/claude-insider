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
