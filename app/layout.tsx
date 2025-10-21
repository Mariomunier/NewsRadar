export const metadata = {
  title: "NewsRadar",
  description: "Nyhedsradar",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className="dark">
      <body>{children}</body>
    </html>
  );
}
