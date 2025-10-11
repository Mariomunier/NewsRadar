export const metadata = { title: "NewsRadar", description: "Nyhedsradar" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body style={{ fontFamily: "system-ui, Arial, sans-serif" }}>{children}</body>
    </html>
  );
}
