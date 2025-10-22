// app/layout.tsx (med TradingView-inspireret ramme)
import type { Metadata } from "next";
import "./globals.css";
import Shell from "./ui/Shell";

export const metadata: Metadata = {
  title: { default: "NewsRadar", template: "%s • NewsRadar" },
  description: "Nyhedsradar – TradingView-inspireret overblik",
  viewport: { width: "device-width", initialScale: 1, viewportFit: "cover" },
  themeColor: "#0f1219",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className="dark">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}

