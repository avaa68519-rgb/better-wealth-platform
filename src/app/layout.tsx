import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Better Wealth Investment Group",
    template: "%s | Better Wealth Investment Group",
  },
  description: "A considered investment experience for long-term wealth.",
};

export const viewport: Viewport = {
  themeColor: "#071a31",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
