import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { tasks, taskLogs } from '../../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '../../../../../lib/auth';

async function checkTaskOwnership(taskId: number) {
  const user = await getCurrentUser();
  if (!user) return false;

  const [task] = await db.select({ userId: tasks.userId }).from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!task) return false;

  if (user.admin) return true; // Admin can edit/delete anything
  return task.userId === user.id;
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);

    const isOwner = await checkTaskOwnership(taskId);
    if (!isOwner) return NextResponse.json({ error: 'Unauthorized or not found' }, { status: 403 });

    // Drizzle with simple pgTable: Delete logs first due to FK constraint
    await db.delete(taskLogs).where(eq(taskLogs.taskId, taskId)).run();
    
    // Delete the task itself
    const deletedTask = await db.delete(tasks).where(eq(tasks.id, taskId)).returning();

    if (deletedTask.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: deletedTask[0] });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { title, tag } = await request.json();
    const taskId = parseInt(id, 10);

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const isOwner = await checkTaskOwnership(taskId);
    if (!isOwner) return NextResponse.json({ error: 'Unauthorized or not found' }, { status: 403 });
    
    // Update the task title and tag
    const updatedTask = await db.update(tasks).set({ title, tag }).where(eq(tasks.id, taskId)).returning();

    if (updatedTask.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: updatedTask[0] });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

