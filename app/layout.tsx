import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Huisdierenverzekering Vergelijken | Transparant & Eerlijk",
  description: "Vergelijk de beste huisdierenverzekeringen voor je hond of kat. Binnen 1 minuut 3 aanbiedingen. Transparant en zonder gedoe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
