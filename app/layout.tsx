import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Remedis — Sistema de Gestión de Clínica",
  description: "Control total de tu clínica empresarial",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full bg-deep-space-black text-pure-white antialiased font-ss01">
        {children}
      </body>
    </html>
  );
}
