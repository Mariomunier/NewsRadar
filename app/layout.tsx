import "./globals.css";
import Shell from "./ui/Shell";

export const metadata = {
  title: "NewsRadar",
  description: "Nyhedsradar",
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
