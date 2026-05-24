import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-backend';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.habit.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Habit not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const { name, icon, color, frequency, targetDays, category, priority, archived, sortOrder, reminderTime } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (icon !== undefined) data.icon = icon;
    if (color !== undefined) data.color = color;
    if (frequency !== undefined) data.frequency = frequency;
    if (targetDays !== undefined) data.targetDays = targetDays ? JSON.stringify(targetDays) : null;
    if (category !== undefined) data.category = category;
    if (priority !== undefined) data.priority = priority;
    if (archived !== undefined) data.archived = archived;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (reminderTime !== undefined) data.reminderTime = reminderTime || null;

    const habit = await prisma.habit.update({
      where: { id },
      data,
    });

    return NextResponse.json(habit);
  } catch (error) {
    console.error('Error updating habit:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.habit.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Habit not found or unauthorized' }, { status: 404 });
    }

    await prisma.habit.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting habit:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
