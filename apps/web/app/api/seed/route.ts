import { getPayload } from 'payload';
import config from '@payload-config';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
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

    // Create admin user
    const user = await payload.create({
      collection: 'users',
      data: {
        email: 'vladimir@dukelic.com',
        password: 'TestPassword123',
        name: 'Vladimir Dukelic',
        role: 'admin',
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
