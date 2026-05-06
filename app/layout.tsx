import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "FoodTrove — Fresh Groceries Delivered",
  description:
    "Shop fresh produce, dairy, bakery, snacks, beverages, meat, frozen foods, and household essentials. FoodTrove — quality you can taste.",
  openGraph: {
    title: "FoodTrove — Fresh Groceries Delivered",
    description: "Your neighborhood grocery store, online.",
    siteName: "FoodTrove",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-stone-50 font-sans text-stone-900">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
