import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import {
  updateUserStatus,
  findUserTaskIds,
  deleteTaskLogsByTaskIds,
  deleteTasksByUserId,
  deleteUserById,
} from '../../../../db/repository';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const targetUserId = parseInt(id, 10);
    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const { status } = await request.json();
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    await updateUserStatus(targetUserId, status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const targetUserId = parseInt(id, 10);

    // Delete logs first to satisfy FK constraints
    const taskIds = await findUserTaskIds(targetUserId);
    if (taskIds.length > 0) {
      await deleteTaskLogsByTaskIds(taskIds);
    }

    await deleteTasksByUserId(targetUserId);
    await deleteUserById(targetUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
