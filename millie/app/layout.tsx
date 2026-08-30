import type { Metadata } from "next";
import { Providers } from "@/lib/providers";
import { EB_Garamond } from "next/font/google";
import { getUserSettings } from "@/app/actions/auth";
import SiteBackgroundPaper from "../componentes/SiteBackgroundPaper";
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { preferences } = await getUserSettings();

  return (
    <html lang="pt-BR" className={preferences.animacoesInterface ? "" : "no-animations"}>
      <body className={ebGaramond.variable}>
        <Providers initialPreferences={preferences}>
          <div className="site-background" aria-hidden="true" />
          <div className="site-shell">{children}</div>
          <SiteBackgroundPaper />
        </Providers>
      </body>
    </html>
  );
}