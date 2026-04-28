"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import SidebarLayout from "@/components/SidebarLayout";
import AdminSidebarLayout from "@/components/admin/AdminSidebarLayout";

export default function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const isPublicRoute =
    pathname === "/login" ||
    pathname === "/comercio/login" ||
    pathname?.startsWith("/usuarios");

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      {pathname?.startsWith("/admin") ? (
        <AdminSidebarLayout>{children}</AdminSidebarLayout>
      ) : (
        <SidebarLayout>{children}</SidebarLayout>
      )}
    </AuthGuard>
  );
}
