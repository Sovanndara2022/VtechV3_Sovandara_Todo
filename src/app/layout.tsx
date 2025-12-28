import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VTech Todo",
  description: "Dummy + Supabase realtime todo"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>{children}</body>
    </html>
  );
}