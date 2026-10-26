"use client";
import { AuthFlow } from "./auth-flow";
import { useSession } from "@/lib/auth-client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "./i18n-provider";
export function CustomerAuthPage({ signup = false }: { signup?: boolean }) {
  const { data, isPending } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  useEffect(() => {
    if (data?.user) router.replace("/live");
  }, [data?.user, router]);
  if (isPending || data?.user)
    return (
      <main className="rb-state" role="status">
        {t("loading")}
      </main>
    );
  return (
    <AuthFlow
      initialSignup={signup}
      onReady={() => window.location.replace("/live")}
    />
  );
}
