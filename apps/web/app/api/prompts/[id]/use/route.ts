/**
 * Prompt Usage Tracking API
 *
 * POST: Track when a prompt is used with enhanced analytics
 * - Builder mode (direct, quick, guided, chat, playground)
 * - Device info (viewport, mobile, touch)
 * - Category tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface DeviceInfo {
  viewport?: string;
  isMobile?: boolean;
  isTouch?: boolean;
  referrer?: string | null;
}

interface UsageBody {
  context?: string;
  builderMode?: string;
  variablesUsed?: Record<string, string>;
  fingerprintHash?: string;
  deviceInfo?: DeviceInfo;
  promptCategory?: string;
}

/**
 * POST /api/prompts/[id]/use
 * Track prompt usage with enhanced analytics
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await getSession();
    const userId = session?.user?.id || null;

    const body: UsageBody = await request.json().catch(() => ({}));
    const {
      context: usageContext,
      builderMode,
      variablesUsed,
      fingerprintHash,
      deviceInfo,
      promptCategory,
    } = body;

    // Check if prompt exists
    const promptCheck = await pool.query(
      'SELECT id FROM prompts WHERE id = $1',
      [id]
    );

    if (promptCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Build metadata object for enhanced analytics
    const metadata = {
      builderMode: builderMode || 'direct',
      category: promptCategory || null,
      device: deviceInfo ? {
        viewport: deviceInfo.viewport,
        isMobile: deviceInfo.isMobile,
        isTouch: deviceInfo.isTouch,
        referrer: deviceInfo.referrer,
      } : null,
    };

    // Insert usage record with enhanced data
    await pool.query(`
      INSERT INTO prompt_usage (
        user_id, prompt_id, context, variables_used, fingerprint_hash
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      userId,
      id,
      usageContext || 'assistant',
      // Store both variables and metadata in the JSONB field
      JSON.stringify({
        variables: variablesUsed || {},
        ...metadata,
      }),
      userId ? null : fingerprintHash || null,
    ]);

    // Get updated use count
    const countResult = await pool.query(
      'SELECT use_count FROM prompts WHERE id = $1',
      [id]
    );

    return NextResponse.json({
      success: true,
      useCount: countResult.rows[0]?.use_count || 0,
    });
  } catch (error) {
    console.error('Error tracking prompt usage:', error);
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    );
  }
}
