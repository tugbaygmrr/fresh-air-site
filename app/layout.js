import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "AeroSystem | Havalandırma ve İklimlendirme Sistemleri",
  description:
    "Klima santralleri, havalandırma fanları, soğutma ekipmanları ve iklimlendirme sistemleri üretimi. 1 milyon m² proje deneyimiyle AeroSystem.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className={montserrat.className}>{children}</body>
    </html>
  );
}
