import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Fresh Air HVAC | Modern Homepage",
  description: "Fresh Air HVAC için modern, animasyon destekli ana sayfa taslağı.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className={montserrat.className}>{children}</body>
    </html>
  );
}
