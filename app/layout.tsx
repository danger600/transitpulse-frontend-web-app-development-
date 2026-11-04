import "./globals.css";

export const metadata = {
  title: "TransitPulse",
  description: "Public transport disruption monitor and commuter dashboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
