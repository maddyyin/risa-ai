import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-backend';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sixtyDaysAgoDate = new Date();
    sixtyDaysAgoDate.setDate(sixtyDaysAgoDate.getDate() - 60);
    const sixtyDaysAgo = sixtyDaysAgoDate.toISOString().split('T')[0];

    const habits = await prisma.habit.findMany({
      where: { 
        userId: user.id,
        archived: false 
      },
      include: {
        completions: {
          where: {
            date: { gte: sixtyDaysAgo },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(habits);
  } catch (error) {
    console.error('Error fetching habits:', error);
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
    const { name, icon, color, frequency, targetDays, category, priority } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const maxSortOrderHabit = await prisma.habit.findFirst({
      where: { userId: user.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const nextSortOrder = (maxSortOrderHabit?.sortOrder ?? -1) + 1;

    const habit = await prisma.habit.create({
      data: {
        userId: user.id,
        name,
        icon: icon || '📌',
        color: color || '#8b5cf6',
        frequency: frequency || 'daily',
        targetDays: targetDays ? JSON.stringify(targetDays) : null,
        category: category || 'General',
        priority: priority || 'medium',
        sortOrder: nextSortOrder,
      },
    });

    return NextResponse.json(habit);
  } catch (error) {
    console.error('Error creating habit:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
