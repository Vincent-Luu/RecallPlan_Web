import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import { updateTaskLogStatus } from '../../../../db/repository';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { status } = await request.json();

    if (typeof status !== 'boolean') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updatedLog = await updateTaskLogStatus(parseInt(id, 10), status);

    if (!updatedLog) {
      return NextResponse.json({ error: 'Task log not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, log: updatedLog });
  } catch (error) {
    console.error('Error updating task log:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
