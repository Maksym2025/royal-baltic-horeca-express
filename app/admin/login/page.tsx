import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/server/auth";
import { ApiError } from "@/lib/server/db";
import { AdminLogin } from "@/components/admin-login";

const notices: Record<string, string> = {
  forbidden:
    "This account does not have administrator access. Sign in with an administrator account.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  let isAdmin = false;
  try {
    await requireAdmin({ headers: await headers() });
    isAdmin = true;
  } catch (e) {
    if (!(e instanceof ApiError) || ![401, 403].includes(e.status)) throw e;
  }
  if (isAdmin) redirect("/admin");
  return <AdminLogin notice={reason === "forbidden" ? notices.forbidden : undefined} />;
}
