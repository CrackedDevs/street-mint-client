"use client";

import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import "@solana/wallet-adapter-react-ui/styles.css";
// import { TipLinkWalletAdapter } from "@tiplink/wallet-adapter";

export default function AppWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const network =
    process.env.NODE_ENV === "development"
      ? WalletAdapterNetwork.Devnet
      : WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(() => {
    return [
      // new TipLinkWalletAdapter({
      //   title: "Streetmint",
      //   clientId: process.env.TIPLINK_CLIENT_ID as string,
      //   theme: "dark", // pick between "dark"/"light"/"system"
      // }),
      new PhantomWalletAdapter(),
    ];
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
