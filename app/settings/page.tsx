import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "../../lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const isAdmin = !!user.admin;

  // 读取高考倒计时偏好（env admin 无 DB 记录，传 undefined 走 localStorage 回退）
  let gaokaoEnabled: boolean | undefined;
  if (user.id !== null && user.id !== undefined) {
    const [userRow] = await db
      .select({ gaokaoEnabled: users.gaokaoEnabled })
      .from(users)
      .where(eq(users.id, user.id as number))
      .limit(1);
    gaokaoEnabled = userRow?.gaokaoEnabled;
  }

  let allUsers: Array<{
    id: number;
    username: string;
    role: string;
    status: string;
    createdAt: Date;
  }> = [];

  if (isAdmin) {
    allUsers = await db.select({
      id: users.id,
      username: users.username,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
    }).from(users);
  }

  return (
    <SettingsClient
      isAdmin={isAdmin}
      initialUsers={allUsers}
      gaokaoEnabled={gaokaoEnabled}
    />
  );
}
