import { getCurrentUser } from "../../lib/auth";
import { redirect } from "next/navigation";
import StatsClient from "./StatsClient";

export const dynamic = "force-dynamic";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const targetUserId = params.userId
    ? parseInt(params.userId, 10)
    : undefined;

  // Only admins may view other users' stats
  const effectiveTargetUserId = user.admin ? targetUserId : undefined;

  const backHref = effectiveTargetUserId
    ? `/settings/user/${effectiveTargetUserId}/tasks`
    : "/";

  return (
    <StatsClient
      initialTargetUserId={effectiveTargetUserId}
      isAdmin={!!user.admin}
      backHref={backHref}
      currentUserId={user.id as number | undefined}
    />
  );
}
