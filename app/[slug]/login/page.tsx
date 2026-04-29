"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ComercioLoginSlugPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const slug = String(params?.slug || "").trim();

    if (!slug) {
      router.replace("/comercio/login");
      return;
    }

    router.replace(`/comercio/login?slug=${encodeURIComponent(slug)}`);
  }, [params, router]);

  return null;
}