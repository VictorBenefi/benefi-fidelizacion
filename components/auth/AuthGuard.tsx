"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isPublicRoute =
      pathname === "/login" ||
      pathname === "/comercio/login" ||
      pathname?.startsWith("/usuarios");

    // ✅ el admin no lo controla este guard
    const isAdminRoute = pathname?.startsWith("/admin");

    if (isPublicRoute || isAdminRoute) {
      setLoading(false);
      return;
    }

    const comercioId = localStorage.getItem("comercio_id");

    if (!comercioId) {
      router.push("/login");
      return;
    }

    setLoading(false);
  }, [pathname, router]);

  if (loading) return null;

  return <>{children}</>;
}