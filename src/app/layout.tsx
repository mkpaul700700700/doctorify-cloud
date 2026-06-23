import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Navbar from "@/components/Navbar";
import GlobalListenerWrapper from "@/components/GlobalListenerWrapper";

export const metadata: Metadata = {
  title: "Doctorify - Premium Healthcare",
  description: "Book appointments and manage your health seamlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <GlobalListenerWrapper />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
