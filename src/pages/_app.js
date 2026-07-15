import "@/styles/globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { I18nProvider } from "@/i18n/provider";
import Footer from "@/components/Footer";

export default function App({ Component, pageProps }) {
  return (
    <I18nProvider>
      <Component {...pageProps} />
      <Footer />
    </I18nProvider>
  );
}
