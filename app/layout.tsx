export const metadata = { title: "NewsRadar", description: "Nyhedsradar" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body style={{ fontFamily: "system-ui, Arial, sans-serif" }}>{children}</body>
    </html>
  );
}
import "./globals.css";
import Shell from "./ui/Shell"; // hvis du allerede har Shell, ellers bare brug children

export const metadata = { title: "NewsRadar", description: "Nyhedsradar" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className="dark">
      <body>
        {/* Hvis du har Shell-komponenten, brug den: */}
        {typeof Shell === "function" ? <Shell>{children}</Shell> : children}
      </body>
    </html>
  );
}
