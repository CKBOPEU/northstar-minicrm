import "./globals.css";
export const metadata = {
  title: "Northstar CRM — Clear work, warmer relationships",
  description: "A bilingual local CRM portfolio demo",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
