import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Remedis — Sistema de Gestión de Clínica",
  description: "Control total de tu clínica empresarial",
  icons: {
    icon: "/images/iconoremedis.png",
    apple: "/images/iconoremedis.png",
    shortcut: "/images/iconoremedis.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`h-full ${inter.variable}`} suppressHydrationWarning>
      <body className="h-full antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
