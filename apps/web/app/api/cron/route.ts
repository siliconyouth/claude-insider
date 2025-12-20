import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify CRON_SECRET for production security
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
