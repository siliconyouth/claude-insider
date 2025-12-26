/**
 * PayPal Browser-Safe Client Token API
 *
 * Returns a client token for PayPal JavaScript SDK v6 initialization.
 * This token is required for guest payments (card payments without PayPal account).
 *
 * See: https://docs.paypal.ai/payments/methods/paypal/sdk/js/v6/paypal-checkout
 */

import { NextResponse } from 'next/server';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_SANDBOX = process.env.PAYPAL_SANDBOX === 'true';

const PAYPAL_BASE = PAYPAL_SANDBOX
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

export async function GET() {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      console.error('PayPal credentials not configured');
      return NextResponse.json(
        { error: 'PayPal not configured' },
        { status: 500 }
      );
    }

    // Create Basic auth credentials
    const credentials = Buffer.from(
      `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
    ).toString('base64');

    // Request browser-safe client token
    // This special request type returns a token safe for frontend use
    const response = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&response_type=client_token&intent=sdk_init',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PayPal token request failed:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to get client token' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the client token for SDK v6 initialization
    return NextResponse.json({
      clientToken: data.access_token,
      expiresIn: data.expires_in,
    });
  } catch (error) {
    console.error('Client token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
