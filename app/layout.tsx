import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "APx · Agentic Power",
  description: "A proposed measure of verified human and agent output. Same task. Same standard. Time included.",
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
