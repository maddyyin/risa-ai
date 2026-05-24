import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-backend';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: habitId } = await params;

    // Verify ownership of the habit before toggling completion
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId: user.id },
    });
    if (!habit) {
      return NextResponse.json({ error: 'Habit not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const { date } = body;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const existing = await prisma.habitCompletion.findUnique({
      where: {
        habitId_date: {
          habitId,
          date,
        },
      },
    });

    if (existing) {
      await prisma.habitCompletion.delete({
        where: {
          id: existing.id,
        },
      });
      return NextResponse.json({ completed: false });
    } else {
      await prisma.habitCompletion.create({
        data: {
          habitId,
          date,
          completed: true,
        },
      });
      return NextResponse.json({ completed: true });
    }
  } catch (error) {
    console.error('Error toggling habit completion:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
