"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSession } from "@/lib/auth-client";
import { apiJson, HttpError } from "@/lib/live-api";
import type { IntentData } from "@/lib/product-intent";
import { useI18n } from "./i18n-provider";
import { intentCopy } from "./intent-copy";
type IntentContext = {
  data: IntentData;
  loading: boolean;
  failed: boolean;
  busy: boolean;
  notice: string;
  needsLogin: boolean;
  refresh: () => Promise<void>;
  reserve: (id: string, qty: number) => Promise<void>;
  interest: (id: string, wanted: boolean) => Promise<void>;
};
const Context = createContext<IntentContext | null>(null);
export function useProductIntent() {
  const value = useContext(Context);
  if (!value) throw Error("Missing product intent provider");
  return value;
}
export function ProductIntentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const { locale } = useI18n();
  const c = intentCopy[locale];
  const [data, setData] = useState<IntentData>({
    products: [],
    counts: {},
    liked: [],
    preorders: [],
  });
  const [loading, setLoading] = useState(true),
    [failed, setFailed] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState<
      "" | "signin" | "saved" | "cancelled" | "approval" | "error"
    >(""),
    [needsLogin, setNeedsLogin] = useState(false);
  const userId = session?.user.id;
  const refresh = useCallback(async () => {
    try {
      setData(await apiJson<IntentData>("/api/product-intent"));
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    // Synchronize the account-scoped server data after authentication changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh, userId]);
  async function mutate(
    body:
      | { action: "reserve"; productId: string; quantity: number }
      | { action: "interest"; productId: string; interested: boolean },
  ) {
    if (busy) return;
    setNotice("");
    setNeedsLogin(false);
    if (!userId) {
      if (body.action === "reserve" && body.quantity > 0)
        try {
          sessionStorage.setItem(
            "rb-preorder-selection",
            JSON.stringify({
              productId: body.productId,
              quantity: body.quantity,
            }),
          );
        } catch {}
      setNeedsLogin(true);
      setNotice("signin");
      return;
    }
    setBusy(true);
    try {
      await apiJson("/api/product-intent", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      await refresh();
      setNotice(
        body.action === "reserve"
          ? body.quantity
            ? "saved"
            : "cancelled"
          : "",
      );
      if (body.action === "reserve")
        try {
          sessionStorage.removeItem("rb-preorder-selection");
        } catch {}
    } catch (e) {
      setNotice(
        e instanceof HttpError && e.status === 403 ? "approval" : "error",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Context.Provider
      value={{
        data,
        loading,
        failed,
        busy,
        notice: notice ? c[notice] : "",
        needsLogin,
        refresh,
        reserve: (productId, quantity) =>
          mutate({ action: "reserve", productId, quantity }),
        interest: (productId, interested) =>
          mutate({ action: "interest", productId, interested }),
      }}
    >
      {children}
    </Context.Provider>
  );
}
