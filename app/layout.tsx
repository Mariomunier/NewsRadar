// app/layout.tsx  (MINIMAL for at få build grønt)
export const metadata = {
  title: "NewsRadar",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body>{children}</body>
    </html>
  );
}
