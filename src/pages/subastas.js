import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, ethers } from "ethers";
import {
  EVENTS_RPC_URL,
  FACTORY_ABI,
  FACTORY_ADDRESS,
  FACTORY_DEPLOY_BLOCK,
  SUBASTA_ABI,
} from "@/features/subasta/config";
import { obtenerMensajeError } from "@/features/subasta/utils";
import styles from "@/styles/SubastasHub.module.css";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function shortAddress(addr) {
  if (!addr || addr.length < 10) return "-";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function SubastasHubPage() {
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
      mostrarMensaje("warning", "MetaMask no detectado.");
      return null;
    }

    const chainId = await provider.request({ method: "eth_chainId" });
    if (chainId !== "0x61") {
      mostrarMensaje("warning", `Red incorrecta. MetaMask esta en chainId ${parseInt(chainId, 16)}.`);
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

  const cargarParticipando = async (addresses, account) => {
    if (!account || addresses.length === 0) return [];

    const providerRpc = new ethers.providers.JsonRpcProvider(EVENTS_RPC_URL);
    const topic0 = ethers.utils.id("NuevaPuja(address,uint256)");
    const topicBidder = ethers.utils.hexZeroPad(account, 32);

    const logsPorSubasta = await Promise.all(
      addresses.map(async (address) => {
        const logs = await providerRpc.getLogs({
          address,
          fromBlock: FACTORY_DEPLOY_BLOCK > 0 ? FACTORY_DEPLOY_BLOCK : 0,
          toBlock: "latest",
          topics: [topic0, topicBidder],
        });
        return { address, logsCount: logs.length };
      })
    );

    return logsPorSubasta.filter((x) => x.logsCount > 0).map((x) => x.address);
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
      const [allDetails, myDetails, participandoAddresses] = await Promise.all([
        cargarResumenSubastas(allAddresses, account, providerLectura),
        cargarResumenSubastas(myAddresses, account, providerLectura),
        cargarParticipando(allAddresses, account),
      ]);

      const participandoDetails = await cargarResumenSubastas(participandoAddresses, account, providerLectura);

      setTodas(allDetails);
      setMias(myDetails);
      setParticipando(participandoDetails);
    } catch (error) {
      mostrarMensaje("danger", obtenerMensajeError(error, "No se pudo cargar el hub de subastas."));
    } finally {
      setCargando(false);
    }
  };

  const crearSubasta = async () => {
    if (!factoryDisponible) {
      mostrarMensaje("warning", "Configura NEXT_PUBLIC_FACTORY_ADDRESS para habilitar esta accion.");
      return;
    }

    if (!producto.trim()) {
      mostrarMensaje("warning", "Indica el nombre del producto.");
      return;
    }

    const mins = Number(duracion);
    if (!Number.isInteger(mins) || mins <= 0) {
      mostrarMensaje("warning", "La duracion debe ser un entero positivo en minutos.");
      return;
    }

    setCreando(true);
    try {
      const provider = await obtenerProvider();
      if (!provider) return;

      const signer = provider.getSigner();
      const factory = new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
      const tx = await factory.crearSubasta(producto.trim(), mins);
      mostrarMensaje("info", "Creacion enviada. Esperando confirmacion...");
      await tx.wait();
      setProducto("");
      await cargarListados();
      mostrarMensaje("success", "Subasta creada correctamente.");
    } catch (error) {
      mostrarMensaje("danger", obtenerMensajeError(error, "No se pudo crear la subasta."));
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
                  <th>Producto</th>
                  <th>Owner</th>
                  <th>Puja mas alta</th>
                  <th>Mi puja</th>
                  <th>Estado</th>
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
                    <td>{s.finalizada ? "Finalizada" : "Activa"}</td>
                    <td>
                      <Link
                        className="btn btn-outline-primary btn-sm"
                        href={`/subasta?address=${s.address}`}
                      >
                        Abrir
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
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Link href="/" className="btn btn-outline-dark btn-sm rounded-pill px-3">
            Inicio
          </Link>
          <Link href="/subasta" className="btn btn-outline-primary btn-sm rounded-pill px-3">
            Subasta actual
          </Link>
        </div>

        <header className="mb-4">
          <h1 className="display-6 fw-bold mb-2">Centro de Subastas</h1>
          <p className="text-muted mb-0">Crea nuevas subastas desde la app y gestiona tus participaciones.</p>
          <small className="text-muted">Wallet: {cuenta || "-"}</small>
        </header>

        {!factoryDisponible && (
          <Alert tipo="warning">
            Falta configurar <strong>NEXT_PUBLIC_FACTORY_ADDRESS</strong> en .env.local para habilitar la creacion y listados.
          </Alert>
        )}

        {mensaje.texto && (
          <Alert tipo={mensaje.tipo === "danger" ? "danger" : mensaje.tipo === "warning" ? "warning" : mensaje.tipo === "success" ? "success" : "info"}>
            {mensaje.texto}
          </Alert>
        )}

        <section className="card mb-3">
          <div className="card-body">
            <h2 className="h5 mb-3">Crear subasta</h2>
            <div className="row g-2 align-items-end">
              <div className="col-12 col-md-6">
                <label className="form-label">Producto</label>
                <input
                  type="text"
                  className="form-control"
                  value={producto}
                  onChange={(e) => setProducto(e.target.value)}
                  placeholder="Ej: Teclado mecanico"
                  disabled={!factoryDisponible || creando}
                />
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label">Duracion (min)</label>
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
                  {creando ? "Creando..." : "Crear"}
                </button>
              </div>
              <div className="col-12 col-md-auto">
                <button className="btn btn-outline-secondary" onClick={cargarListados} disabled={cargando || !factoryDisponible}>
                  {cargando ? "Actualizando..." : "Recargar"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <Lista
          titulo="Mis subastas creadas"
          items={mias}
          emptyText="Aun no has creado ninguna subasta desde esta factory."
        />

        <Lista
          titulo="Subastas donde participo"
          items={participando}
          emptyText="Todavia no has pujado en subastas de esta factory."
        />

        <Lista titulo="Todas las subastas" items={todas} emptyText="No hay subastas creadas aun." />
      </div>
    </div>
  );
}
