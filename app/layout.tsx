import type { Metadata } from "next";
import { ReactNode } from "react";
import { Roboto } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "BENEFI Comercio",
  description: "Terminal, dashboard y backoffice BENEFI",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es">
      <body className={roboto.className} style={{ margin: 0 }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}