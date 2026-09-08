import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "APx · Agentic Power",
  description: "APx measures how quickly an AI agent system produces approved work compared with a qualified person doing the same job.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
