import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "FamilyFit — Nutrición y entrenamiento familiar",
  description:
    "Planifica la alimentación y el entrenamiento de tu familia con comida peruana y una lista de compras económica.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#d91e2a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="mx-auto min-h-screen max-w-md pb-20">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
