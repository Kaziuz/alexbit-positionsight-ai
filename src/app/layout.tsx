import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PositionSight AI",
  description:
    "AI-powered crypto position intelligence skill for CoinMarketCap market data, visual risk, and backtestable strategies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
