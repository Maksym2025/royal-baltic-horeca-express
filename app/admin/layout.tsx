import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Administration · Royal Baltic",
  robots: { index: false, follow: false },
};

// Administration has its own shell. The customer header is hidden for /admin
// routes in components/app-header.tsx.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div lang="en" dir="ltr">
      {children}
    </div>
  );
}
