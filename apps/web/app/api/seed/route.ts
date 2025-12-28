import { getPayload } from 'payload';
import config from '@payload-config';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Require CRON_SECRET for security - prevents unauthorized seeding
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await getPayload({ config });

    // Check if any users exist
    const existingUsers = await payload.find({
      collection: 'users',
      limit: 1,
    });

    if (existingUsers.totalDocs > 0) {
      return NextResponse.json(
        { error: 'Users already exist. Cannot seed.' },
        { status: 400 }
      );
    }

    // Create superadmin user (first user should have full access)
    const user = await payload.create({
      collection: 'users',
      data: {
        email: 'vladimir@dukelic.com',
        password: 'TestPassword123',
        name: 'Vladimir Dukelic',
        role: 'superadmin',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to seed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to seed the database' });
}
