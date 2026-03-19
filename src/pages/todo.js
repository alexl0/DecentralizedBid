import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, ethers } from "ethers";
import myContractManifest from "../contracts/ToDoSimple.json";
import { useState, useEffect, useRef } from "react";

// Reemplaza esta direccion con la de tu contrato desplegado en Remix
const CONTRACT_ADDRESS = "0x75EeC290F921EFC15cF5C296cBA3323eBA6c1D3A";

export default function TodoPage() {
  const myContract = useRef(null);
  const [tareas, setTareas] = useState([]);
  const [descripcion, setDescripcion] = useState("");
  const [cuenta, setCuenta] = useState("");

  useEffect(() => {
    initContracts();
  }, []);

  const initContracts = async () => {
    await configureBlockchain();
    await cargarTareas();
  };

  const configureBlockchain = async () => {
    try {
      let provider = await detectEthereumProvider();
      if (provider) {
        const accounts = await provider.request({ method: "eth_requestAccounts" });
        setCuenta(accounts[0]);

        const chainId = await provider.request({ method: "eth_chainId" });
        if (chainId !== "0x61") {
          alert(`Red incorrecta. MetaMask esta en chainId ${parseInt(chainId, 16)}. Cambia a BSC Testnet (97).`);
          return;
        }

        provider = new ethers.providers.Web3Provider(provider);
        const signer = provider.getSigner();

        myContract.current = new Contract(CONTRACT_ADDRESS, myContractManifest.abi, signer);
      }
    } catch (error) {
      console.error("Error al conectar con blockchain:", error);
    }
  };

  const cargarTareas = async () => {
    if (!myContract.current) return;
    try {
      const [descs, completadas, creadores] = await myContract.current.todasLasTareas();
      const lista = descs.map((desc, i) => ({
        id: i,
        descripcion: desc,
        completada: completadas[i],
        creador: creadores[i],
      }));
      setTareas(lista);
    } catch (error) {
      console.error("Error al cargar tareas:", error);
    }
  };

  const handleAgregarTarea = async () => {
    if (!myContract.current || !descripcion.trim()) return;
    try {
      const tx = await myContract.current.agregarTarea(descripcion);
      await tx.wait();
      setDescripcion("");
      await cargarTareas();
    } catch (error) {
      console.error("Error al agregar tarea:", error);
    }
  };

  const handleCompletarTarea = async (index) => {
    if (!myContract.current) return;
    try {
      const tx = await myContract.current.completarTarea(index);
      await tx.wait();
      await cargarTareas();
    } catch (error) {
      console.error("Error al completar tarea:", error);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <a href="/">Volver al inicio</a>
      <h1>Lista de Tareas</h1>
      <p style={{ color: "#666", fontSize: "0.85rem" }}>Cuenta: {cuenta}</p>

      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripcion de la nueva tarea..."
          style={{ padding: "0.5rem", width: "300px", marginRight: "0.5rem" }}
          onKeyDown={(e) => e.key === "Enter" && handleAgregarTarea()}
        />
        <button onClick={handleAgregarTarea} style={{ padding: "0.5rem 1rem" }}>
          Agregar Tarea
        </button>
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {tareas.map((tarea) => (
          <li
            key={tarea.id}
            style={{ marginBottom: "0.75rem", padding: "0.75rem", border: "1px solid #ddd", borderRadius: "6px" }}
          >
            <strong>#{tarea.id}</strong> - {tarea.descripcion}{" "}
            {tarea.completada ? (
              <span>Completada</span>
            ) : tarea.creador.toLowerCase() === cuenta.toLowerCase() ? (
              <button onClick={() => handleCompletarTarea(tarea.id)} style={{ marginLeft: "0.5rem" }}>
                Completar
              </button>
            ) : (
              <span>Pendiente</span>
            )}
            <br />
            <small style={{ color: "#888" }}>Creador: {tarea.creador}</small>
          </li>
        ))}
      </ul>

      {tareas.length === 0 && <p>No hay tareas aun.</p>}
    </div>
  );
}
