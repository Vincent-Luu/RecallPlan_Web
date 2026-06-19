/**
 * Repository abstraction layer over Drizzle ORM.
 *
 * All database access flows through this module. API routes never import
 * `db` or `drizzle-orm` directly — they call the functions exported here.
 * This isolates driver-specific details (.run() vs bare await) to a single
 * file so switching between PostgreSQL and SQLite is transparent.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { db } from './client';
import { users, tasks, taskLogs, memos } from './schema';
import { sql, eq, and, gte, lte, isNull, inArray, desc } from 'drizzle-orm';

// Re-export schema tables so API routes can pass them to userCondition()
// without importing from db/schema directly.
export { users, tasks, taskLogs, memos };

// ---------------------------------------------------------------------------
// Helpers — absorb the sql-js / neon-http difference
// ---------------------------------------------------------------------------

/**
 * Execute an INSERT / UPDATE / DELETE that does NOT need a return value.
 * On sql-js the query builder exposes `.run()`; on neon-http it is a
 * thenable and auto-executes when awaited.  This helper normalises both.
 */
async function exec(query: any): Promise<void> {
  const qb = query;
  // sql-js exposes .run() → call it; neon-http ignores it → safe either way
  if (typeof qb.run === 'function') {
    await qb.run();
  } else {
    await qb;
  }
}

/**
 * Execute an INSERT / UPDATE / DELETE that DOES need the affected rows.
 * Returns the full record array (same as Drizzle `.returning()`).
 */
async function execReturning<T = any>(query: any): Promise<T[]> {
  const qb = query;
  // Callers already chain .returning() — don't call it again.
  // Prefer .all() because for sql-js, .run() always delegates to sql.js stmt.run()
  // which returns void even when RETURNING is present in the SQL.
  // .all() uses stmt.step()/stmt.getAsObject() and correctly collects RETURNING rows.
  // For neon-http the query is a thenable that auto-executes on await.
  if (typeof qb.all === 'function') {
    return (await qb.all()) as T[];
  }
  if (typeof qb.run === 'function') {
    return (await qb.run()) as T[];
  }
  return (await qb) as T[];
}

// ---------------------------------------------------------------------------
// Shared userCondition builder
// ---------------------------------------------------------------------------

interface AuthUser {
  admin?: boolean;
  id?: number | null;
}

/**
 * Build the WHERE condition that scopes queries to the current user.
 * Replicated identically from every API route that deals with user-scoped data.
 *
 * - If admin requests another user's data (`targetUserId`), scope to that user.
 * - If super-admin (env) has no DB id, scope to `userId IS NULL`.
 * - Otherwise scope to `userId = currentUser.id`.
 */
export function userCondition(
  table: typeof tasks | typeof memos,
  user: AuthUser,
  targetUserId?: number,
) {
  if (user.admin && targetUserId !== undefined) {
    return eq(table.userId, targetUserId);
  }
  if (user.admin && user.id === null) {
    return isNull(table.userId);
  }
  return eq(table.userId, user.id as number);
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function findUserByUsername(username: string) {
  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return rows[0] ?? null;
}

export async function listUsers() {
  return db.select({
    id: users.id,
    username: users.username,
    role: users.role,
    status: users.status,
    createdAt: users.createdAt,
  }).from(users);
}

export async function insertUser(data: {
  username: string;
  password: string;
  role?: string;
  status?: string;
}) {
  await exec(
    db.insert(users).values({
      username: data.username,
      password: data.password,
      role: (data.role as any) || 'user',
      status: (data.status as any) || 'approved',
    }),
  );
}

export async function updateUserStatus(targetUserId: number, status: string) {
  await exec(
    db.update(users).set({ status: status as any }).where(eq(users.id, targetUserId)),
  );
}

export async function updateUserSettings(userId: number, data: { gaokaoEnabled: boolean }) {
  await exec(
    db.update(users).set({ gaokaoEnabled: data.gaokaoEnabled }).where(eq(users.id, userId)),
  );
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export async function insertTask(data: { title: string; tag?: string; userId: number | null }) {
  const rows = await execReturning<{ id: number }>(
    db.insert(tasks).values({
      title: data.title,
      tag: data.tag || null,
      userId: data.userId,
    }).returning({ id: tasks.id }),
  );
  if (!rows[0]) throw new Error('Failed to insert task: no row returned');
  return rows[0].id;
}

export async function insertTaskLogs(
  logs: Array<{
    taskId: number;
    scheduleDate: string;
    status: boolean;
    type?: string;
  }>,
) {
  await exec(db.insert(taskLogs).values(logs));
}

export async function findTaskOwner(taskId: number) {
  const rows = await db
    .select({ userId: tasks.userId })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);
  return rows[0] ?? null;
}

export async function findTaskLogsForDate(
  date: string,
  condition: ReturnType<typeof userCondition>,
) {
  return db
    .select({
      id: taskLogs.id,
      taskId: taskLogs.taskId,
      scheduleDate: taskLogs.scheduleDate,
      status: taskLogs.status,
      title: tasks.title,
      tag: tasks.tag,
      createdAt: tasks.createdAt,
      type: taskLogs.type,
    })
    .from(taskLogs)
    .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
    .where(and(eq(taskLogs.scheduleDate, date), condition));
}

export async function findAllTasks(condition: ReturnType<typeof userCondition>) {
  return db
    .select({
      id: tasks.id,
      title: tasks.title,
      tag: tasks.tag,
      createdAt: tasks.createdAt,
      totalLogs: sql<number>`count(${taskLogs.id})`.mapWith(Number),
      completedLogs: sql<number>`count(CASE WHEN ${taskLogs.status} = true THEN 1 END)`.mapWith(Number),
    })
    .from(tasks)
    .leftJoin(taskLogs, eq(tasks.id, taskLogs.taskId))
    .where(condition)
    .groupBy(tasks.id)
    .orderBy(tasks.createdAt);
}

export async function findMonthStatus(
  start: string,
  end: string,
  condition: ReturnType<typeof userCondition>,
): Promise<Record<string, { completed: number; total: number }>> {
  const logs = await db
    .select({
      scheduleDate: taskLogs.scheduleDate,
      status: taskLogs.status,
    })
    .from(taskLogs)
    .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
    .where(and(gte(taskLogs.scheduleDate, start), lte(taskLogs.scheduleDate, end), condition));

  const daily: Record<string, { completed: number; total: number }> = {};
  for (const log of logs) {
    if (!daily[log.scheduleDate]) {
      daily[log.scheduleDate] = { completed: 0, total: 0 };
    }
    daily[log.scheduleDate].total += 1;
    if (log.status) daily[log.scheduleDate].completed += 1;
  }
  return daily;
}

export async function deleteTaskLogsByTaskId(taskId: number) {
  await exec(db.delete(taskLogs).where(eq(taskLogs.taskId, taskId)));
}

export async function deleteTaskById(taskId: number) {
  const rows = await execReturning(
    db.delete(tasks).where(eq(tasks.id, taskId)).returning(),
  );
  return rows[0] ?? null;
}

export async function deleteTaskLogsByTaskIds(taskIds: number[]) {
  await exec(db.delete(taskLogs).where(inArray(taskLogs.taskId, taskIds)));
}

export async function deleteTasksByUserId(targetUserId: number) {
  await exec(db.delete(tasks).where(eq(tasks.userId, targetUserId)));
}

export async function deleteUserById(targetUserId: number) {
  await exec(db.delete(users).where(eq(users.id, targetUserId)));
}

export async function updateTask(taskId: number, data: { title: string; tag?: string }) {
  const rows = await execReturning(
    db.update(tasks)
      .set({ title: data.title, tag: data.tag || null })
      .where(eq(tasks.id, taskId))
      .returning(),
  );
  return rows[0] ?? null;
}

export async function updateTaskLogStatus(logId: number, status: boolean) {
  const rows = await execReturning(
    db.update(taskLogs)
      .set({ status })
      .where(eq(taskLogs.id, logId))
      .returning(),
  );
  return rows[0] ?? null;
}

export async function findUserTaskIds(userId: number) {
  const rows = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.userId, userId));
  return rows.map((r: { id: number }) => r.id);
}

// ---------------------------------------------------------------------------
// Memos
// ---------------------------------------------------------------------------

export async function findMemoById(memoId: number) {
  const rows = await db.select().from(memos).where(eq(memos.id, memoId)).limit(1);
  return rows[0] ?? null;
}

export async function listMemos(condition: ReturnType<typeof userCondition>) {
  return db.select().from(memos).where(condition).orderBy(desc(memos.updatedAt));
}

export async function insertMemo(data: {
  title: string;
  content: string;
  userId: number | null;
}) {
  const rows = await execReturning(
    db.insert(memos).values({
      title: data.title,
      content: data.content,
      userId: data.userId,
    }).returning(),
  );
  return rows[0] ?? null;
}

export async function updateMemo(
  memoId: number,
  data: { updatedAt: Date; title?: string; content?: string },
) {
  const rows = await execReturning(
    db.update(memos).set(data).where(eq(memos.id, memoId)).returning(),
  );
  return rows[0] ?? null;
}

export async function deleteMemoById(memoId: number) {
  await exec(db.delete(memos).where(eq(memos.id, memoId)));
}

// ---------------------------------------------------------------------------
// Stats (complex aggregated queries)
// ---------------------------------------------------------------------------

export async function statsCompletion(
  condition: ReturnType<typeof userCondition>,
  dateCondition?: ReturnType<typeof and>,
) {
  const rows = await db
    .select({
      completed: sql<number>`COUNT(CASE WHEN ${taskLogs.status} = true THEN 1 END)`.mapWith(Number),
      total: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(taskLogs)
    .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
    .where(dateCondition ? and(condition, dateCondition) : condition);
  const completed = rows[0]?.completed ?? 0;
  const total = rows[0]?.total ?? 0;
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
  };
}

export async function statsSubjects(
  condition: ReturnType<typeof userCondition>,
  dateCondition?: ReturnType<typeof and>,
) {
  return db
    .select({
      tag: tasks.tag,
      completed: sql<number>`COUNT(CASE WHEN ${taskLogs.status} = true THEN 1 END)`.mapWith(Number),
      total: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(taskLogs)
    .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
    .where(dateCondition ? and(condition, dateCondition) : condition)
    .groupBy(tasks.tag);
}

export async function statsCompletedDates(condition: ReturnType<typeof userCondition>) {
  return db
    .select({ scheduleDate: taskLogs.scheduleDate })
    .from(taskLogs)
    .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
    .where(and(condition, eq(taskLogs.status, true)));
}

export async function statsTotalCompleted(condition: ReturnType<typeof userCondition>) {
  const rows = await db
    .select({
      count: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(taskLogs)
    .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
    .where(and(condition, eq(taskLogs.status, true)));
  return rows[0]?.count ?? 0;
}

export async function statsMonthlyTrend(
  condition: ReturnType<typeof userCondition>,
  monthStart: string,
  monthEnd: string,
) {
  return db
    .select({
      date: taskLogs.scheduleDate,
      count: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(taskLogs)
    .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
    .where(
      and(
        condition,
        eq(taskLogs.status, true),
        gte(taskLogs.scheduleDate, monthStart),
        lte(taskLogs.scheduleDate, monthEnd),
      ),
    )
    .groupBy(taskLogs.scheduleDate)
    .orderBy(taskLogs.scheduleDate);
}

export async function statsIntervalData(condition: ReturnType<typeof userCondition>) {
  return db
    .select({
      scheduleDate: taskLogs.scheduleDate,
      status: taskLogs.status,
      createdAt: tasks.createdAt,
    })
    .from(taskLogs)
    .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
    .where(condition);
}
