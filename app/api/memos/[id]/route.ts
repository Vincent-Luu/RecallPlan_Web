import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import { findMemoById, updateMemo, deleteMemoById } from '../../../../db/repository';

async function checkMemoOwnership(memoId: number) {
  const user = await getCurrentUser();
  if (!user) return null;

  const memo = await findMemoById(memoId);
  if (!memo) return null;

  if (user.admin) return memo;
  if (memo.userId === user.id) return memo;
  return null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const memoId = parseInt(id, 10);

    const memo = await checkMemoOwnership(memoId);
    if (!memo) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const { title, content } = await request.json();
    if (title !== undefined && !title.trim()) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content;

    const updated = await updateMemo(memoId, updateData as { updatedAt: Date; title?: string; content?: string });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating memo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const memoId = parseInt(id, 10);

    const memo = await checkMemoOwnership(memoId);
    if (!memo) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    await deleteMemoById(memoId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting memo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
