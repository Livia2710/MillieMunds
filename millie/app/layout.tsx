import type { Metadata } from "next";
import { Providers } from "@/lib/providers";
import { EB_Garamond } from "next/font/google";
import "./globals.css";

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Millie Munds",
  description: "Escola dos Mil Mundos",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={ebGaramond.variable}>
        <Providers>
          <div className="site-background" aria-hidden="true" />
          <div className="site-shell">{children}</div>
          <div className="site-background-paper" aria-hidden="true" />
        </Providers>
      </body>
    </html>
  );
}