import { useI18n } from "@/i18n/provider";
import styles from "@/styles/Footer.module.css";

const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className={styles.footer}>
      <p
        dangerouslySetInnerHTML={{
          __html: t("ui.footerRepo"),
        }}
      />
      <p>{t("ui.footerBsc")}</p>
    </footer>
  );
};

export default Footer;
