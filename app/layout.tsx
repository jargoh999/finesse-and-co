import type { Metadata } from "next";
import { Alex_Brush } from "next/font/google";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}