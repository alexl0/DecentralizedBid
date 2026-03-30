import { useEffect, useRef, useState } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, ethers } from "ethers";

// Sustituye esta direccion por la de tu SubastaSimple desplegada en Remix.
const CONTRACT_ADDRESS = "0xc5050909Bd04bB01529327C553Ec7D511D0260bE";

const SUBASTA_ABI = [
  "function producto() view returns (string)",
  "function endTime() view returns (uint256)",
  "function highestBidder() view returns (address)",
  "function highestBid() view returns (uint256)",
  "function bids(address) view returns (uint256)",
  "function subastaFinalizada() view returns (bool)",
  "function ganador() view returns (address)",
  "function pujar() payable",
  "function retirarNoGanador()",
  "event NuevaPuja(address indexed bidder, uint256 amount)",
];

export default function SubastaPage() {
  const contractRef = useRef(null);

  const [cuenta, setCuenta] = useState("");
  const [producto, setProducto] = useState("");
  const [highestBid, setHighestBid] = useState("0");
  const [highestBidder, setHighestBidder] = useState("");
  const [miPuja, setMiPuja] = useState("0");
  const [finalizada, setFinalizada] = useState(false);
  const [ganador, setGanador] = useState("");

  const [montoBNB, setMontoBNB] = useState("");
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const mostrarMensaje = (tipo, texto) => setMensaje({ tipo, texto });

  const obtenerMensajeError = (error, fallback) => {
    // Intentar extraer el mensaje de varias formas
    if (error?.reason) return error.reason;
    if (error?.error?.message) return error.error.message;
    if (error?.data?.message) return error.data.message;
    
    // Si el error es un string con formato Solidity revert
    if (error?.message && error.message.includes("execution reverted:")) {
      const parte = error.message.split("execution reverted:")[1];
      if (parte) return "Error: " + parte.trim().split(";")[0];
    }
    
    // Fallback genérico
    return fallback;
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
      const cuentaActiva = account || cuenta;
      const [
        productoValue,
        highestBidValue,
        highestBidderValue,
        miPujaWei,
        finalizadaValue,
      ] = await Promise.all([
        contractRef.current.producto(),
        contractRef.current.highestBid(),
        contractRef.current.highestBidder(),
        cuentaActiva ? contractRef.current.bids(cuentaActiva) : Promise.resolve(ethers.BigNumber.from(0)),
        contractRef.current.subastaFinalizada(),
      ]);

      setProducto(productoValue);
      setHighestBid(ethers.utils.formatEther(highestBidValue));
      setHighestBidder(highestBidderValue);
      setMiPuja(ethers.utils.formatEther(miPujaWei));
      setFinalizada(finalizadaValue);

      if (finalizadaValue) {
        try {
          const g = await contractRef.current.ganador();
          setGanador(g);
        } catch {
          setGanador("");
        }
      }
    } catch (error) {
      console.error("Error al cargar estado:", error);
      mostrarMensaje("danger", obtenerMensajeError(error, "Error al cargar estado de la subasta."));
    }
  };

  const pujar = async () => {
    if (!contractRef.current) return;
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
          <p className="mb-3"><strong>Finalizada:</strong> {finalizada ? "Si" : "No"}</p>
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
                disabled={finalizada}
              />
              <small className="text-muted">Solo numeros decimales en BNB.</small>
            </div>
            <div className="col-12 col-md-auto">
              <button
                className="btn btn-primary"
                onClick={pujar}
                disabled={finalizada || !esMontoValido(montoBNB)}
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
              <button className="btn btn-outline-success" onClick={retirar} disabled={finalizada && miPuja === "0"}>
                Retirar fondos (no ganador)
              </button>
            )}
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
