"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const admin = localStorage.getItem("admin_user");

    if (!admin) {
      router.push("/login");
    }
  }, []);

  return <>{children}</>;
}