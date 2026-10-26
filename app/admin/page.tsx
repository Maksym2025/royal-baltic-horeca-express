import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/server/auth";
import { ApiError } from "@/lib/server/db";
import { AdminConsole } from "@/components/admin-console";
export default async function AdminPage() {
  try {
    await requireAdmin({ headers: await headers() });
  } catch (e) {
    if (e instanceof ApiError && e.status === 403)
      redirect("/admin/login?reason=forbidden");
    if (e instanceof ApiError && e.status === 401) redirect("/admin/login");
    throw e;
  }
  return <AdminConsole />;
}
