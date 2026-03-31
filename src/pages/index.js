import Link from "next/link";
import styles from "@/styles/HomeHub.module.css";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/i18n/provider";

export default function Home() {
  const { t } = useI18n();

  return (
    <div className={styles.page}>
      <div className={styles.orbA} aria-hidden="true" />
      <div className={styles.orbB} aria-hidden="true" />

      <div className="container hero" style={{ maxWidth: "1080px" }}>
        <div className="d-flex justify-content-end pt-4">
          <LanguageSwitcher />
        </div>

        <section className={styles.hero}>
          <p className={styles.badgeTitle}>{t("ui.appBadge")}</p>
          <h1 className={`display-4 mb-3 ${styles.title}`}>{t("ui.homeTitle")}</h1>
          <p className={`lead mb-0 ${styles.subtitle}`}>
            {t("ui.homeSubtitle")}
          </p>
        </section>

        <div className="row g-3 pb-5">
          <div className="col-12">
            <article className={`card h-100 ${styles.cardCool}`}>
              <div className={`card-header ${styles.cardCoolHeader}`}>
                <h2 className="h5 mb-0">{t("ui.auctionsHub")}</h2>
              </div>
              <div className="card-body d-flex flex-column">
                <p className="text-muted mb-4">
                  {t("ui.homeHubDescription")}
                </p>
                <div className="mt-auto d-flex gap-2">
                  <Link href="/subastas" className="btn btn-primary">
                    {t("ui.openHub")}
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
