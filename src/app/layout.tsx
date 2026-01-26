import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import { Web3Provider } from "@/components/Web3Provider";
import { ChatDepositProvider } from "@/contexts/ChatDepositContext";
import { LastAgent } from "@/components/LastAgent";

export const metadata: Metadata = {
  title: "Last Network",
  description: "The network for DeFi protocols on Hyperliquid. Apply to join, connect with other projects, and grow together.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Web3Provider>
          <SessionProvider>
            <ChatDepositProvider>
              {children}
              <LastAgent />
            </ChatDepositProvider>
          </SessionProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
