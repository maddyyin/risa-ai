import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-backend';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const tasks = await prisma.dailyTask.findMany({
      where: { 
        userId: user.id,
        date 
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching daily tasks:', error);
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
    const { title, date } = body;

    if (!title || !date) {
      return NextResponse.json({ error: 'Title and Date are required' }, { status: 400 });
    }

    const maxSortOrderTask = await prisma.dailyTask.findFirst({
      where: { 
        userId: user.id,
        date 
      },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const nextSortOrder = (maxSortOrderTask?.sortOrder ?? -1) + 1;

    const task = await prisma.dailyTask.create({
      data: {
        userId: user.id,
        title,
        date,
        completed: false,
        sortOrder: nextSortOrder,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error creating daily task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
