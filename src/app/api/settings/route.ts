import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-backend';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      name: userRecord.name,
      email: userRecord.email,
      motivationTone: userRecord.motivationTone,
      aggressiveness: userRecord.aggressiveness,
      focusStart: userRecord.focusStart,
      focusEnd: userRecord.focusEnd,
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, motivationTone, aggressiveness, focusStart, focusEnd } = body;

    const userRecord = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || undefined,
        email: email || undefined,
        motivationTone: motivationTone || undefined,
        aggressiveness: aggressiveness || undefined,
        focusStart: focusStart || undefined,
        focusEnd: focusEnd || undefined,
      },
    });

    return NextResponse.json({
      name: userRecord.name,
      email: userRecord.email,
      motivationTone: userRecord.motivationTone,
      aggressiveness: userRecord.aggressiveness,
      focusStart: userRecord.focusStart,
      focusEnd: userRecord.focusEnd,
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
