import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Remedis — Sistema de Gestión Clínica",
  description: "Expedientes médicos, farmacia, dispensación e integración con seguro social. El sistema todo-en-uno para clínicas empresariales y privadas.",
  keywords: "sistema clínica, gestión médica, seguro social, expedientes clínicos, farmacia empresarial, gestión clínica",
  openGraph: {
    title: "Remedis — Gestión Clínica Todo-en-Uno",
    description: "El sistema todo-en-uno para clínicas empresariales y privadas.",
    url: "https://remedis.brandsofts.com",
    siteName: "Remedis",
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
