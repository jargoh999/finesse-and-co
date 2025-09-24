import type { Metadata } from "next";
import { Alex_Brush } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import FloatingOrderButton from "@/components/FloatingOrderButton";

// Load Alex Brush - an elegant, flowing script font
const alexBrush = Alex_Brush({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-alex-brush",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Finesse & Co..",
  description: "Experience the essence of luxury",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={alexBrush.variable}>
      <body className={`${alexBrush.className} antialiased`}>
        <CartProvider>
          {children}
          <FloatingOrderButton />
        </CartProvider>
      </body>
    </html>
  );
}