import { Montserrat } from "next/font/google";
import Script from "next/script";
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
      <head>
        <link
          rel="preload"
          href="/models/hero-model-web.glb"
          as="fetch"
          type="model/gltf-binary"
          crossOrigin="anonymous"
        />
        <link
          rel="modulepreload"
          href="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
          crossOrigin="anonymous"
        />
      </head>
      <body className={montserrat.className}>
        <Script
          type="module"
          src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
