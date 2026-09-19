import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/server/auth";
import { ApiError } from "@/lib/server/db";
import { AdminConsole } from "@/components/admin-console";
export default async function AdminPage() {
  try {
    await requireAdmin({ headers: await headers() });
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403))
      redirect("/");
    throw e;
  }
  return <AdminConsole />;
}
