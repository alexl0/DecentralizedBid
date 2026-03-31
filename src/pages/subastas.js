import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, ethers } from "ethers";
import {
  EVENTS_RPC_URL,
  FACTORY_ABI,
  FACTORY_ADDRESS,
  SUBASTA_ABI,
} from "@/features/subasta/config";
import { obtenerMensajeErrorTraducido } from "@/features/subasta/utils";
import { useI18n } from "@/i18n/provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import styles from "@/styles/SubastasHub.module.css";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function shortAddress(addr) {
  if (!addr || addr.length < 10) return "-";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function SubastasHubPage() {
  const { t } = useI18n();
  const [cuenta, setCuenta] = useState("");
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [producto, setProducto] = useState("");
  const [duracion, setDuracion] = useState("30");
  const [cargando, setCargando] = useState(false);
  const [creando, setCreando] = useState(false);

  const [todas, setTodas] = useState([]);
  const [mias, setMias] = useState([]);
  const [participando, setParticipando] = useState([]);

  const factoryDisponible = useMemo(
    () => FACTORY_ADDRESS && FACTORY_ADDRESS !== ZERO_ADDRESS,
    []
  );

  const mostrarMensaje = (tipo, texto) => setMensaje({ tipo, texto });

  const obtenerProvider = async () => {
    const provider = await detectEthereumProvider();
    if (!provider) {
      mostrarMensaje("warning", t("common.metamaskNotDetected"));
      return null;
    }

    const chainId = await provider.request({ method: "eth_chainId" });
    if (chainId !== "0x61") {
      mostrarMensaje("warning", t("common.wrongNetwork", { chainId: parseInt(chainId, 16) }));
      return null;
    }

    const accounts = await provider.request({ method: "eth_requestAccounts" });
    setCuenta(accounts[0] || "");

    return new ethers.providers.Web3Provider(provider);
  };

  const cargarResumenSubastas = async (addresses, account, providerLectura) => {
    const resumenes = await Promise.all(
      addresses.map(async (address) => {
        try {
          const c = new Contract(address, SUBASTA_ABI, providerLectura);
          const [owner, productoValue, endTime, highestBid, finalizada, miPuja] = await Promise.all([
            c.owner(),
            c.producto(),
            c.endTime(),
            c.highestBid(),
            c.subastaFinalizada(),
            account ? c.bids(account) : Promise.resolve(ethers.BigNumber.from(0)),
          ]);

          return {
            address,
            owner,
            producto: productoValue,
            endTime: endTime.toNumber(),
            highestBid: ethers.utils.formatEther(highestBid),
            finalizada,
            miPuja: ethers.utils.formatEther(miPuja),
          };
        } catch {
          return null;
        }
      })
    );

    return resumenes.filter(Boolean);
  };

  const cargarListados = async () => {
    if (!factoryDisponible) return;

    setCargando(true);
    try {
      const provider = await obtenerProvider();
      if (!provider) return;

      const signer = provider.getSigner();
      const account = await signer.getAddress();
      setCuenta(account);

      const factory = new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
      const [allAddresses, myAddresses] = await Promise.all([
        factory.getSubastas(),
        factory.getSubastasPorOwner(account),
      ]);

      const providerLectura = new ethers.providers.JsonRpcProvider(EVENTS_RPC_URL);
      const [allDetails, myDetails] = await Promise.all([
        cargarResumenSubastas(allAddresses, account, providerLectura),
        cargarResumenSubastas(myAddresses, account, providerLectura),
      ]);

      // Participacion calculada sin logs: si mi puja es > 0 en la subasta.
      const participandoDetails = allDetails.filter((s) => Number(s.miPuja) > 0);

      setTodas(allDetails);
      setMias(myDetails);
      setParticipando(participandoDetails);
    } catch (error) {
      mostrarMensaje("danger", obtenerMensajeErrorTraducido(error, t, t("hub.loadError")));
    } finally {
      setCargando(false);
    }
  };

  const crearSubasta = async () => {
    if (!factoryDisponible) {
      mostrarMensaje("warning", t("hub.factoryRequiredToCreate"));
      return;
    }

    if (!producto.trim()) {
      mostrarMensaje("warning", t("hub.productRequired"));
      return;
    }

    const mins = Number(duracion);
    if (!Number.isInteger(mins) || mins <= 0) {
      mostrarMensaje("warning", t("hub.durationInvalid"));
      return;
    }

    setCreando(true);
    try {
      const provider = await obtenerProvider();
      if (!provider) return;

      const signer = provider.getSigner();
      const factory = new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
      const tx = await factory.crearSubasta(producto.trim(), mins);
      mostrarMensaje("info", t("hub.createSent"));
      await tx.wait();
      setProducto("");
      await cargarListados();
      mostrarMensaje("success", t("hub.createSuccess"));
    } catch (error) {
      mostrarMensaje("danger", obtenerMensajeErrorTraducido(error, t, t("hub.createError")));
    } finally {
      setCreando(false);
    }
  };

  useEffect(() => {
    if (!factoryDisponible) return;
    cargarListados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoryDisponible]);

  const Alert = ({ tipo, children }) => (
    <div className={`alert alert-${tipo} mb-3`} role="alert">
      {children}
    </div>
  );

  const Lista = ({ titulo, items, emptyText }) => (
    <section className="card mb-3">
      <div className="card-body">
        <h2 className="h5 mb-3">{titulo}</h2>
        {items.length === 0 ? (
          <p className="mb-0 text-muted">{emptyText}</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>{t("ui.product")}</th>
                  <th>{t("ui.owner")}</th>
                  <th>{t("ui.highestBid")}</th>
                  <th>{t("ui.myBid")}</th>
                  <th>{t("ui.status")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.address}>
                    <td>{s.producto}</td>
                    <td title={s.owner}>{shortAddress(s.owner)}</td>
                    <td>{s.highestBid} BNB</td>
                    <td>{s.miPuja} BNB</td>
                    <td>{s.finalizada ? t("ui.finished") : t("ui.active")}</td>
                    <td>
                      <Link
                        className="btn btn-outline-primary btn-sm"
                        href={`/subasta?address=${s.address}`}
                      >
                        {t("ui.open")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className={styles.page}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <div className="container py-4" style={{ maxWidth: "1080px" }}>
        <div className="d-flex align-items-center mb-3">
          <Link href="/" className="btn btn-outline-dark btn-sm rounded-pill px-3">
            {t("ui.home")}
          </Link>
          <div className="ms-auto">
            <LanguageSwitcher />
          </div>
        </div>

        <header className="mb-4">
          <h1 className="display-6 fw-bold mb-2">{t("ui.auctionsHub")}</h1>
          <p className="text-muted mb-0">{t("ui.hubSubtitle")}</p>
          <small className="text-muted">{t("ui.walletLabel")}: {cuenta || "-"}</small>
        </header>

        {!factoryDisponible && (
          <Alert tipo="warning">
            {t("hub.factoryMissingEnv")}
          </Alert>
        )}

        {mensaje.texto && (
          <Alert tipo={mensaje.tipo === "danger" ? "danger" : mensaje.tipo === "warning" ? "warning" : mensaje.tipo === "success" ? "success" : "info"}>
            {mensaje.texto}
          </Alert>
        )}

        <section className="card mb-3">
          <div className="card-body">
            <h2 className="h5 mb-3">{t("ui.createAuction")}</h2>
            <div className="row g-2 align-items-end">
              <div className="col-12 col-md-6">
                <label className="form-label">{t("ui.product")}</label>
                <input
                  type="text"
                  className="form-control"
                  value={producto}
                  onChange={(e) => setProducto(e.target.value)}
                  placeholder={t("ui.productPlaceholder")}
                  disabled={!factoryDisponible || creando}
                />
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label">{t("ui.durationMin")}</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={duracion}
                  onChange={(e) => setDuracion(e.target.value)}
                  disabled={!factoryDisponible || creando}
                />
              </div>
              <div className="col-12 col-md-auto">
                <button className="btn btn-primary" onClick={crearSubasta} disabled={!factoryDisponible || creando}>
                  {creando ? t("ui.creating") : t("ui.create")}
                </button>
              </div>
              <div className="col-12 col-md-auto">
                <button className="btn btn-outline-secondary" onClick={cargarListados} disabled={cargando || !factoryDisponible}>
                  {cargando ? t("ui.updating") : t("ui.reload")}
                </button>
              </div>
            </div>
          </div>
        </section>

        <Lista
          titulo={t("ui.myAuctions")}
          items={mias}
          emptyText={t("ui.noCreatedAuctions")}
        />

        <Lista
          titulo={t("ui.participatingAuctions")}
          items={participando}
          emptyText={t("ui.noParticipatingAuctions")}
        />

        <Lista titulo={t("ui.allAuctions")} items={todas} emptyText={t("ui.noAuctions")} />
      </div>
    </div>
  );
}
