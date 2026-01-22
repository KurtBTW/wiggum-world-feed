import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HypurrRelevant - Forward Thinking News",
  description: "The news branch of HypurrFi. Curated news filtered for optimism and forward progress.",
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
        {children}
      </body>
    </html>
  );
}
