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
  pathname === "/" ||
  pathname === "/login" ||
  pathname === "/comercio/login" ||
  pathname?.startsWith("/usuarios") ||
  (
    pathname.split("/").length === 2 &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/comercio")
  ) ||
  (
    pathname.split("/").length === 3 &&
    pathname.endsWith("/login") &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/comercio")
  );

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
