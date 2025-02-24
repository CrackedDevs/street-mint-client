import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppWalletProvider from "@/components/AppWalletProvider";
import { FpjsProvider } from "@fingerprintjs/fingerprintjs-pro-react";
import { UserProfileProvider } from "./providers/UserProfileProvider";

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
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        />
      </head>
      <body className={inter.className}>
        <AppWalletProvider>
          <UserProfileProvider>
            <FpjsProvider
              loadOptions={{
                apiKey: "eWFatM86xt5behmgNQd3",
                // region: "us",
              }}
            >
              {children}
            </FpjsProvider>
          </UserProfileProvider>
        </AppWalletProvider>
      </body>
    </html>
  );
}
