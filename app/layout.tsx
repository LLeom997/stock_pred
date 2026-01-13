import type { Metadata } from "next";
import { Outfit } from "next/font/google"; // Outfit is a good Google Sans alternative
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "700"] });

export const metadata: Metadata = {
  title: "Hedge Fund Stock",
  description: "Advanced Volatility Forecasting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
