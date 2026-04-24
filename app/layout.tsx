import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Speciale Fitness — Lead Gen Dashboard",
  description: "Lead generation dashboard for Speciale Fitness",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full" style={{ backgroundColor: '#0a0a0a', color: '#f0f0f0' }}>
        {children}
      </body>
    </html>
  );
}
