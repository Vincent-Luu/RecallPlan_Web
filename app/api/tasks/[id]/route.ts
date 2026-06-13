import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { taskLogs } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (typeof status !== 'boolean') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updatedLog = await db.update(taskLogs)
      .set({ status })
      .where(eq(taskLogs.id, parseInt(id, 10)))
      .returning();

    if (updatedLog.length === 0) {
      return NextResponse.json({ error: 'Task log not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, log: updatedLog[0] });
  } catch (error) {
    console.error('Error updating task log:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
