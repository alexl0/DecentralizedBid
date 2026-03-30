import { useEffect, useRef, useState } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, ethers } from "ethers";

// Sustituye esta direccion por la de tu SubastaSimple desplegada en Remix.
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

const SUBASTA_ABI = [
  "function owner() view returns (address)",
  "function producto() view returns (string)",
  "function endTime() view returns (uint256)",
  "function highestBidder() view returns (address)",
  "function highestBid() view returns (uint256)",
  "function fondosGanadorRetirados() view returns (bool)",
  "function bids(address) view returns (uint256)",
  "function subastaFinalizada() view returns (bool)",
  "function ganador() view returns (address)",
  "function pujar() payable",
  "function retirarNoGanador()",
  "function retirarFondosGanador()",
  "event NuevaPuja(address indexed bidder, uint256 amount)",
  "event FondosGanadorRetirados(address indexed to, uint256 amount)",
];

export default function SubastaPage() {
  const contractRef = useRef(null);

  const [cuenta, setCuenta] = useState("");
  const [owner, setOwner] = useState("");
  const [producto, setProducto] = useState("");
  const [highestBid, setHighestBid] = useState("0");
  const [highestBidder, setHighestBidder] = useState("");
  const [miPuja, setMiPuja] = useState("0");
  const [endTime, setEndTime] = useState(0);
  const [ahora, setAhora] = useState(Math.floor(Date.now() / 1000));
  const [finalizada, setFinalizada] = useState(false);
  const [ganador, setGanador] = useState("");
  const [fondosGanadorRetirados, setFondosGanadorRetirados] = useState(false);

  const [montoBNB, setMontoBNB] = useState("");
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const esOwner = owner && cuenta && owner.toLowerCase() === cuenta.toLowerCase();

  const mostrarMensaje = (tipo, texto) => setMensaje({ tipo, texto });

  const limpiarMensajeRevert = (rawMessage) => {
    if (!rawMessage || !rawMessage.includes("execution reverted")) return null;

    let parte = rawMessage.split("execution reverted:")[1] || rawMessage.split("execution reverted")[1] || "";
    parte = parte.trim();
    parte = parte.replace(/: 0x[0-9a-fA-F]+$/, "").trim();

    if (!parte) return "Transaccion revertida";
    return parte.startsWith("Error:") ? parte : `Error: ${parte}`;
  };

  const obtenerMensajeError = (error, fallback) => {
    const revertFromReason = limpiarMensajeRevert(error?.reason);
    if (revertFromReason) return revertFromReason;

    const revertFromNested = limpiarMensajeRevert(error?.error?.message);
    if (revertFromNested) return revertFromNested;

    const revertFromData = limpiarMensajeRevert(error?.data?.message);
    if (revertFromData) return revertFromData;

    if (error?.reason) return error.reason;
    if (error?.error?.message) return error.error.message;
    if (error?.data?.message) return error.data.message;
    if (error?.message) return error.message;

    // Fallback genérico
    return fallback;
  };

  const tiempoRestanteTexto = () => {
    if (!endTime) return "-";
    const restante = endTime - ahora;
    if (restante <= 0) return "Finalizada";

    const horas = Math.floor(restante / 3600);
    const minutos = Math.floor((restante % 3600) / 60);
    const segundos = restante % 60;
    return `${horas}h ${minutos}m ${segundos}s`;
  };

  const esMontoValido = (valor) => {
    if (!valor) return false;
    const normalizado = valor.replace(",", ".");
    if (!/^\d*(\.\d*)?$/.test(normalizado)) return false;
    if (normalizado === ".") return false;
    try {
      return ethers.utils.parseEther(normalizado).gt(0);
    } catch {
      return false;
    }
  };

  const onChangeMonto = (value) => {
    const normalizado = value.replace(",", ".");
    if (/^\d*(\.\d*)?$/.test(normalizado)) {
      setMontoBNB(normalizado);
    }
  };

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setAhora(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const init = async () => {
    const account = await configureBlockchain();
    await cargarEstado(account);
  };

  const configureBlockchain = async () => {
    try {
      let provider = await detectEthereumProvider();
      if (!provider) {
        mostrarMensaje("warning", "MetaMask no detectado.");
        return null;
      }

      const accounts = await provider.request({ method: "eth_requestAccounts" });
      setCuenta(accounts[0]);

      const chainId = await provider.request({ method: "eth_chainId" });
      if (chainId !== "0x61") {
        mostrarMensaje(
          "warning",
          `Red incorrecta. MetaMask esta en chainId ${parseInt(chainId, 16)}. Cambia a BSC Testnet (97).`
        );
        return null;
      }

      provider = new ethers.providers.Web3Provider(provider);
      const signer = provider.getSigner();

      contractRef.current = new Contract(CONTRACT_ADDRESS, SUBASTA_ABI, signer);
      mostrarMensaje("success", "Wallet conectada y contrato cargado.");
      return accounts[0];
    } catch (error) {
      console.error("Error de conexion:", error);
      mostrarMensaje("danger", obtenerMensajeError(error, "Error de conexion con blockchain."));
      return null;
    }
  };

  const cargarEstado = async (account) => {
    if (!contractRef.current) return;

    try {
      const ownerValue = await contractRef.current.owner();
      setOwner(ownerValue);

      const cuentaActiva = account || cuenta;
      const [
        productoValue,
        endTimeValue,
        highestBidValue,
        highestBidderValue,
        miPujaWei,
        finalizadaValue,
      ] = await Promise.all([
        contractRef.current.producto(),
        contractRef.current.endTime(),
        contractRef.current.highestBid(),
        contractRef.current.highestBidder(),
        cuentaActiva ? contractRef.current.bids(cuentaActiva) : Promise.resolve(ethers.BigNumber.from(0)),
        contractRef.current.subastaFinalizada(),
      ]);

      setProducto(productoValue);
      setEndTime(endTimeValue.toNumber());
      setHighestBid(ethers.utils.formatEther(highestBidValue));
      setHighestBidder(highestBidderValue);
      setMiPuja(ethers.utils.formatEther(miPujaWei));
      setFinalizada(finalizadaValue);

      if (finalizadaValue) {
        try {
          const g = await contractRef.current.ganador();
          setGanador(g);
          const fondosRetiradosValue = await contractRef.current.fondosGanadorRetirados();
          setFondosGanadorRetirados(fondosRetiradosValue);
        } catch {
          setGanador("");
        }
      } else {
        setGanador("");
        setFondosGanadorRetirados(false);
      }
    } catch (error) {
      console.error("Error al cargar estado:", error);
      mostrarMensaje("danger", obtenerMensajeError(error, "Error al cargar estado de la subasta."));
    }
  };

  const retirarFondosGanador = async () => {
    if (!contractRef.current) return;

    if (cuenta.toLowerCase() !== owner.toLowerCase()) {
      mostrarMensaje("danger", "Solo el vendedor puede retirar los fondos del ganador.");
      return;
    }

    try {
      const tx = await contractRef.current.retirarFondosGanador();
      mostrarMensaje("info", "Retirada de fondos enviada. Esperando confirmacion...");
      await tx.wait();
      await cargarEstado();
      mostrarMensaje("success", "Fondos del ganador retirados correctamente a tu cartera.");
    } catch (error) {
      console.error("Error al retirar fondos del ganador:", error);
      mostrarMensaje("danger", obtenerMensajeError(error, "Error al retirar fondos del ganador."));
    }
  };

  const pujar = async () => {
    if (!contractRef.current) return;
    if (esOwner) {
      mostrarMensaje("warning", "El vendedor no puede pujar en su propia subasta.");
      return;
    }
    if (finalizada) {
      mostrarMensaje("warning", "La subasta ya ha finalizado. No se admiten mas pujas.");
      return;
    }
    if (!esMontoValido(montoBNB)) {
      mostrarMensaje("warning", "Introduce una cantidad valida de BNB mayor que 0 (ej: 0.01).");
      return;
    }

    try {
      const tx = await contractRef.current.pujar({
        value: ethers.utils.parseEther(montoBNB.replace(",", ".")),
      });
      mostrarMensaje("info", "Puja enviada. Esperando confirmacion...");
      await tx.wait();
      setMontoBNB("");
      await cargarEstado();
      mostrarMensaje("success", "Puja registrada correctamente.");
    } catch (error) {
      console.error("Error al pujar:", error);
      mostrarMensaje("danger", obtenerMensajeError(error, "Error al pujar."));
    }
  };

  const retirar = async () => {
    if (!contractRef.current) return;
    if (!finalizada) {
      mostrarMensaje("warning", "La subasta aun no termina.");
      return;
    }
    if (esOwner) {
      mostrarMensaje("warning", "El vendedor no usa este boton. Debe retirar fondos del ganador.");
      return;
    }
    if (Number(miPuja) <= 0) {
      mostrarMensaje("warning", "No has pujado o ya retiraste tus fondos.");
      return;
    }

    try {
      const tx = await contractRef.current.retirarNoGanador();
      mostrarMensaje("info", "Retirada enviada. Esperando confirmacion...");
      await tx.wait();
      await cargarEstado();
      mostrarMensaje("success", "Fondos retirados correctamente.");
    } catch (error) {
      console.error("Error al retirar:", error);
      mostrarMensaje("danger", obtenerMensajeError(error, "No se pudo retirar."));
    }
  };

  const consultarGanador = async () => {
    if (!contractRef.current) return;

    try {
      const g = await contractRef.current.ganador();
      setGanador(g);
      mostrarMensaje("success", "Ganador consultado correctamente.");
    } catch (error) {
      console.error("Error al consultar ganador:", error);
      mostrarMensaje("warning", obtenerMensajeError(error, "La subasta aun no ha terminado."));
    }
  };

  const alertClass = {
    success: "alert alert-success",
    info: "alert alert-info",
    warning: "alert alert-warning",
    danger: "alert alert-danger",
  };

  return (
    <div className="container py-4" style={{ maxWidth: "900px" }}>
      <div className="mb-3">
        <a href="/" className="btn btn-link ps-0">
          Volver al inicio
        </a>
      </div>

      <h1 className="mb-3">Subasta Descentralizada</h1>

      {mensaje.texto && (
        <div className={alertClass[mensaje.tipo] || "alert alert-secondary"} role="alert">
          {mensaje.texto}
        </div>
      )}

      <div className="card mb-3">
        <div className="card-body">
          <h2 className="h5 card-title">Conexion</h2>
          <p className="mb-1"><strong>Cuenta:</strong> {cuenta || "-"}</p>
          <p className="mb-1"><strong>Owner:</strong> {owner || "-"}</p>
          <p className="mb-0"><strong>Contrato:</strong> {CONTRACT_ADDRESS}</p>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h2 className="h5 card-title">Estado</h2>
          <p className="mb-1"><strong>Producto:</strong> {producto || "-"}</p>
          <p className="mb-1"><strong>Puja mas alta:</strong> {highestBid} BNB</p>
          <p className="mb-1"><strong>Mejor postor:</strong> {highestBidder || "-"}</p>
          <p className="mb-1"><strong>Mi puja:</strong> {miPuja} BNB</p>
          <p className="mb-1"><strong>Finaliza en:</strong> {endTime ? new Date(endTime * 1000).toLocaleString() : "-"}</p>
          <p className="mb-3"><strong>Tiempo restante:</strong> {tiempoRestanteTexto()}</p>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => cargarEstado()}>
            Recargar estado
          </button>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h2 className="h5 card-title">Pujar</h2>
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-5">
              <input
                type="text"
                inputMode="decimal"
                className="form-control"
                value={montoBNB}
                onChange={(e) => onChangeMonto(e.target.value)}
                placeholder="Ej: 0.01"
                disabled={finalizada || esOwner}
              />
              <small className="text-muted">Solo numeros decimales en BNB.</small>
            </div>
            <div className="col-12 col-md-auto">
              <button
                className="btn btn-primary"
                onClick={pujar}
                disabled={finalizada || esOwner || !esMontoValido(montoBNB)}
              >
                Enviar puja
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2 className="h5 card-title">Post-subasta</h2>
          <div className="d-flex flex-wrap gap-2 mb-3">
            <button className="btn btn-outline-primary" onClick={consultarGanador}>
              Consultar ganador
            </button>
            {ganador && ganador.toLowerCase() === cuenta.toLowerCase() ? (
              <div className="alert alert-success mb-0" role="alert">
                Eres el ganador. El vendedor se encargara de enviar el producto.
              </div>
            ) : (
              <button className="btn btn-outline-success" onClick={retirar} disabled={!finalizada || esOwner || Number(miPuja) <= 0}>
                Retirar fondos (no ganador)
              </button>
            )}
            {finalizada && owner && cuenta.toLowerCase() === owner.toLowerCase() ? (
              <button
                className="btn btn-warning"
                onClick={retirarFondosGanador}
                disabled={fondosGanadorRetirados || Number(highestBid) <= 0}
              >
                {fondosGanadorRetirados ? "Fondos ya retirados" : "Retirar fondos ganador (vendedor)"}
              </button>
            ) : null}
          </div>

          {ganador && (
            <p className="mb-0">
              <strong>Ganador:</strong> {ganador}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
