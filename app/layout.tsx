import type { Metadata } from "next";
import { ReactNode } from "react";
import { Roboto } from "next/font/google";
import Script from "next/script";
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

      <head>
        <Script id="gtm-head" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];
            w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;
            j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-NXSM63PV');
          `}
        </Script>
      </head>

      <body className={roboto.className} style={{ margin: 0 }}>

        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NXSM63PV"
            height="0"
            width="0"
            style={{
              display: "none",
              visibility: "hidden",
            }}
          />
        </noscript>

        <AppShell>{children}</AppShell>

      </body>
    </html>
  );
}