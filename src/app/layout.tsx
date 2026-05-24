import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";
import { StoreInitializer } from "@/components/StoreInitializer";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "RISA — Habit Intelligence",
  description: "AI-powered behavioral consistency platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&f[]=cabinet-grotesk@700,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-[#0a0a0f] text-white"
        style={{ fontFamily: "'General Sans', sans-serif" }}
      >
        <AuthProvider>
          <StoreInitializer />
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
