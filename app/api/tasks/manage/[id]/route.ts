import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../lib/auth';
import {
  findTaskOwner,
  deleteTaskLogsByTaskId,
  deleteTaskById,
  updateTask,
} from '../../../../../db/repository';

async function checkTaskOwnership(taskId: number) {
  const user = await getCurrentUser();
  if (!user) return false;

  const task = await findTaskOwner(taskId);
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

    // Delete logs first due to FK constraint
    await deleteTaskLogsByTaskId(taskId);

    // Delete the task itself
    const deletedTask = await deleteTaskById(taskId);

    if (!deletedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: deletedTask });
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

    const updatedTask = await updateTask(taskId, { title, tag });

    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
