import { LiveCommerce } from "@/components/live-commerce";
export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  return (
    <LiveCommerce
      key={view === "orders" ? "orders" : "account"}
      initialView={view === "orders" ? "orders" : "account"}
    />
  );
}
