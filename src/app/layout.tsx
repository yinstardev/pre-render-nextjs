import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TSE PreRender 0x0 Repro",
  description: "Minimal reproduction of preRenderId + fullHeight 0x0 wrapper bug",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "sans-serif" }}>{children}</body>
    </html>
  );
}
