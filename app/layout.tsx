import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eromify Lite",
  description: "Self-hosted AI creator studio"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
