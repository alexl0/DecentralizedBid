import Link from "next/link";
import styles from "@/styles/HomeHub.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.orbA} aria-hidden="true" />
      <div className={styles.orbB} aria-hidden="true" />

      <div className="container hero" style={{ maxWidth: "1080px" }}>
        <section className={styles.hero}>
          <p className={styles.badgeTitle}>BSC Testnet Dapp</p>
          <h1 className={`display-4 mb-3 ${styles.title}`}>Mercado de Subastas Descentralizadas</h1>
          <p className={`lead mb-0 ${styles.subtitle}`}>
            Crea subastas, participa con tu wallet y gestiona tus pujas desde una interfaz unica.
          </p>
        </section>

        <div className="row g-3 pb-5">
          <div className="col-12">
            <article className={`card h-100 ${styles.cardCool}`}>
              <div className={`card-header ${styles.cardCoolHeader}`}>
                <h2 className="h5 mb-0">Centro de subastas</h2>
              </div>
              <div className="card-body d-flex flex-column">
                <p className="text-muted mb-4">
                  Opcion recomendada: crear nuevas subastas y ver listados de subastas creadas y participadas.
                </p>
                <div className="mt-auto d-flex gap-2">
                  <Link href="/subastas" className="btn btn-primary">
                    Abrir centro
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
