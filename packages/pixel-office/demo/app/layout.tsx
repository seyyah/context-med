import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pixel Office Demo",
  description: "Comprehensive demo of the Context-Med 3D Office",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', height: '100vh', width: '100vw' }}>
        {children}
      </body>
    </html>
  );
}
