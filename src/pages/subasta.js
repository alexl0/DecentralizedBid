import { useEffect, useRef, useState } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, ethers } from "ethers";

// Sustituye esta direccion por la de tu SubastaSimple desplegada en Remix.
const CONTRACT_ADDRESS = "0x5F365b80778A4C9B45D8325F02547E095686CF82";

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

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    await configureBlockchain();
    await cargarEstado();
  };

  const configureBlockchain = async () => {
    try {
      let provider = await detectEthereumProvider();
      if (!provider) {
        alert("MetaMask no detectado");
        return;
      }

      const accounts = await provider.request({ method: "eth_requestAccounts" });
      setCuenta(accounts[0]);

      const chainId = await provider.request({ method: "eth_chainId" });
      if (chainId !== "0x61") {
        alert(`Red incorrecta. MetaMask esta en chainId ${parseInt(chainId, 16)}. Cambia a BSC Testnet (97). Si estas utilizando Metamask, entrar en ajustes -> conexiones de Dapp -> localhost:3000 (o la url de esta app) -> utilizar sus redes habilitadas (editar) -> desactivar todas las redes menos la de tBNB`);
        return;
      }

      provider = new ethers.providers.Web3Provider(provider);
      const signer = provider.getSigner();

      contractRef.current = new Contract(CONTRACT_ADDRESS, SUBASTA_ABI, signer);
    } catch (error) {
      console.error("Error de conexion:", error);
    }
  };

  const cargarEstado = async () => {
    if (!contractRef.current) return;

    try {
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
        cuenta ? contractRef.current.bids(cuenta) : Promise.resolve(ethers.BigNumber.from(0)),
        contractRef.current.subastaFinalizada(),
      ]);

      setProducto(productoValue);
      setHighestBid(ethers.utils.formatEther(highestBidValue));
      setHighestBidder(highestBidderValue);
      setMiPuja(ethers.utils.formatEther(miPujaWei));
      setFinalizada(finalizadaValue);
    } catch (error) {
      console.error("Error al cargar estado:", error);
    }
  };

  const pujar = async () => {
    if (!contractRef.current || !montoBNB) return;

    try {
      const tx = await contractRef.current.pujar({
        value: ethers.utils.parseEther(montoBNB),
      });
      await tx.wait();
      setMontoBNB("");
      await cargarEstado();
    } catch (error) {
      console.error("Error al pujar:", error);
      alert(error?.reason || "Error al pujar");
    }
  };

  const retirar = async () => {
    if (!contractRef.current) return;

    try {
      const tx = await contractRef.current.retirarNoGanador();
      await tx.wait();
      await cargarEstado();
      alert("Fondos retirados correctamente");
    } catch (error) {
      console.error("Error al retirar:", error);
      alert(error?.reason || "No se pudo retirar");
    }
  };

  const consultarGanador = async () => {
    if (!contractRef.current) return;

    try {
      const g = await contractRef.current.ganador();
      setGanador(g);
    } catch (error) {
      console.error("Error al consultar ganador:", error);
      alert(error?.reason || "La subasta aun no ha terminado");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "800px" }}>
      <a href="/">Volver al inicio</a>
      <h1>Subasta Descentralizada</h1>
      <p style={{ color: "#666", fontSize: "0.9rem" }}>Cuenta conectada: {cuenta || "-"}</p>
      <p style={{ color: "#666", fontSize: "0.9rem" }}>Contrato: {CONTRACT_ADDRESS}</p>

      <hr />

      <h2>Estado</h2>
      <p>Producto: {producto || "-"}</p>
      <p>Puja mas alta: {highestBid} BNB</p>
      <p>Mejor postor: {highestBidder || "-"}</p>
      <p>Mi puja: {miPuja} BNB</p>
      <p>Finalizada: {finalizada ? "Si" : "No"}</p>

      <button onClick={cargarEstado} style={{ marginBottom: "1rem" }}>
        Recargar estado
      </button>

      <hr />

      <h2>Pujar</h2>
      <input
        type="text"
        value={montoBNB}
        onChange={(e) => setMontoBNB(e.target.value)}
        placeholder="Ej: 0.01"
        style={{ marginRight: "0.5rem", padding: "0.4rem" }}
      />
      <button onClick={pujar}>Enviar puja</button>

      <hr />

      <h2>Post-subasta</h2>
      <button onClick={consultarGanador} style={{ marginRight: "0.5rem" }}>
        Consultar ganador
      </button>
      <button onClick={retirar}>Retirar fondos (si no ganaste)</button>

      {ganador && (
        <p style={{ marginTop: "1rem" }}>
          Ganador: <strong>{ganador}</strong>
        </p>
      )}
    </div>
  );
}
