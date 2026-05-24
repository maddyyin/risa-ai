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
    const existing = await prisma.dailyTask.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const { completed, title, sortOrder } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (completed !== undefined) data.completed = completed;
    if (title !== undefined) data.title = title;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;

    const task = await prisma.dailyTask.update({
      where: { id },
      data,
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating daily task:', error);
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
    const existing = await prisma.dailyTask.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 });
    }

    await prisma.dailyTask.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting daily task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
