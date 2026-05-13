import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/constants";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Remedis — Sistema de Gestión Clínica",
  description: "Expedientes médicos, farmacia, dispensación e integración con seguro social. El sistema todo-en-uno para clínicas empresariales y privadas.",
  keywords: "sistema clínica, gestión médica, seguro social, expedientes clínicos, farmacia empresarial, gestión clínica",
  icons: {
    icon:     "/images/iconoremedis.png",
    apple:    "/images/iconoremedis.png",
    shortcut: "/images/iconoremedis.png",
  },
  openGraph: {
    title: "Remedis — Gestión Clínica Todo-en-Uno",
    description: "El sistema todo-en-uno para clínicas empresariales y privadas.",
    url: SITE_URL,
    siteName: "Remedis",
    images: [{ url: "/images/iconoremedis.png" }],
    locale: "es_LA",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
