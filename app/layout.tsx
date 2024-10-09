import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppWalletProvider from "@/components/AppWalletProvider";
import { FpjsProvider } from "@fingerprintjs/fingerprintjs-pro-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Street Mint",
  description: "Own a piece of the streets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppWalletProvider>
          <FpjsProvider
            loadOptions={{
              apiKey: "w0ZUI01Dq1WYInPXn8Ar",
              region: "ap",
            }}
          >
            {children}
          </FpjsProvider>
        </AppWalletProvider>
      </body>
    </html>
  );
}
