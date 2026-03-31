import { useEffect, useRef, useState } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, ethers } from "ethers";
import { CONTRACT_ADDRESS, EVENTS_RPC_URL, SUBASTA_ABI } from "./config";
import { 
  normalizarMontoInput, 
  obtenerMensajeErrorTraducido,
  convertirAWei,
  esMontoValidoEnUnidad,
  UNIDADES 
} from "./utils";
import { useI18n } from "@/i18n/provider";

export function useSubasta(options = {}) {
  const { t } = useI18n();
  const contractRef = useRef(null);
  const contractAddress = options.contractAddress || CONTRACT_ADDRESS;
  const deployBlockOverride = Number(options.deployBlock || 0);

  const [cuenta, setCuenta] = useState("");
  const [owner, setOwner] = useState("");
  const [producto, setProducto] = useState("");
  const [highestBid, setHighestBid] = useState("0");
  const [highestBidder, setHighestBidder] = useState("");
  const [miPuja, setMiPuja] = useState("0");
  const [endTime, setEndTime] = useState(0);
  const [extensionWindow, setExtensionWindow] = useState(0);
  const [ahora, setAhora] = useState(Math.floor(Date.now() / 1000));
  const [finalizada, setFinalizada] = useState(false);
  const [ganador, setGanador] = useState("");
  const [fondosGanadorRetirados, setFondosGanadorRetirados] = useState(false);
  const [historialPujas, setHistorialPujas] = useState([]);
  const [cargandoPujas, setCargandoPujas] = useState(false);

  const [montoBNB, setMontoBNB] = useState("");
  const [unidad, setUnidad] = useState("BNB");
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const esOwner = owner && cuenta && owner.toLowerCase() === cuenta.toLowerCase();

  const mostrarMensaje = (tipo, texto) => setMensaje({ tipo, texto });

  const onChangeMonto = (value) => {
    const normalizado = normalizarMontoInput(value);
    if (normalizado !== null) setMontoBNB(normalizado);
  };

  const cargarHistorialPujas = async () => {
    if (!contractRef.current) return;

    try {
      setCargandoPujas(true);
      const configuredBlock = Number(process.env.NEXT_PUBLIC_CONTRACT_DEPLOY_BLOCK || 0);
      const bloqueInicio = Number.isFinite(deployBlockOverride) && deployBlockOverride > 0
        ? deployBlockOverride
        : Number.isFinite(configuredBlock) && configuredBlock >= 0
          ? configuredBlock
          : 0;
      const topic0 = ethers.utils.id("NuevaPuja(address,uint256)");

      const provider = new ethers.providers.JsonRpcProvider(EVENTS_RPC_URL);
      const ultimoBloque = await provider.getBlockNumber();
      const interfaz = new ethers.utils.Interface(["event NuevaPuja(address indexed bidder, uint256 amount)"]);

      const TAMANO_TRAMO = 3000;
      let desde = bloqueInicio;
      let logs = [];

      while (desde <= ultimoBloque) {
        const hasta = Math.min(desde + TAMANO_TRAMO - 1, ultimoBloque);
        const lote = await provider.getLogs({
          address: contractAddress,
          fromBlock: desde,
          toBlock: hasta,
          topics: [topic0],
        });
        logs = logs.concat(lote);
        desde = hasta + 1;
      }

      const lista = logs
        .map((log) => {
          const parsed = interfaz.parseLog(log);
          return {
            bidder: parsed.args.bidder,
            amount: ethers.utils.formatEther(parsed.args.amount),
            txHash: log.transactionHash,
          };
        })
        .reverse();

      setHistorialPujas(lista);
    } catch (error) {
      console.error("Error al cargar historial de pujas:", error);
      mostrarMensaje("warning", obtenerMensajeErrorTraducido(error, t, t("subasta.bidHistoryLoadError")));
    } finally {
      setCargandoPujas(false);
    }
  };

  const configureBlockchain = async () => {
    try {
      let provider = await detectEthereumProvider();
      if (!provider) {
        mostrarMensaje("warning", t("common.metamaskNotDetected"));
        return null;
      }

      const accounts = await provider.request({ method: "eth_requestAccounts" });
      setCuenta(accounts[0]);

      const chainId = await provider.request({ method: "eth_chainId" });
      if (chainId !== "0x61") {
        mostrarMensaje(
          "warning",
          t("common.wrongNetwork", { chainId: parseInt(chainId, 16) })
        );
        return null;
      }

      provider = new ethers.providers.Web3Provider(provider);
      const signer = provider.getSigner();
      if (!ethers.utils.isAddress(contractAddress)) {
        mostrarMensaje("warning", t("subasta.invalidAddress"));
        return null;
      }
      contractRef.current = new Contract(contractAddress, SUBASTA_ABI, signer);
      mostrarMensaje("success", t("subasta.walletConnected"));
      return accounts[0];
    } catch (error) {
      console.error("Error de conexion:", error);
      mostrarMensaje("danger", obtenerMensajeErrorTraducido(error, t, t("common.connectionError")));
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
        extensionWindowValue,
        highestBidValue,
        highestBidderValue,
        miPujaWei,
        finalizadaValue,
      ] = await Promise.all([
        contractRef.current.producto(),
        contractRef.current.endTime(),
        contractRef.current.extensionWindow(),
        contractRef.current.highestBid(),
        contractRef.current.highestBidder(),
        cuentaActiva ? contractRef.current.bids(cuentaActiva) : Promise.resolve(ethers.BigNumber.from(0)),
        contractRef.current.subastaFinalizada(),
      ]);

      setProducto(productoValue);
      setEndTime(endTimeValue.toNumber());
      setExtensionWindow(extensionWindowValue.toNumber());
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

      await cargarHistorialPujas();
    } catch (error) {
      console.error("Error al cargar estado:", error);
      mostrarMensaje("danger", obtenerMensajeErrorTraducido(error, t, t("subasta.stateLoadError")));
    }
  };

  const retirarFondosGanador = async () => {
    if (!contractRef.current) return;

    if (cuenta.toLowerCase() !== owner.toLowerCase()) {
      mostrarMensaje("danger", t("subasta.onlySellerWithdrawWinner"));
      return;
    }

    try {
      const tx = await contractRef.current.retirarFondosGanador();
      mostrarMensaje("info", t("subasta.winnerWithdrawSent"));
      await tx.wait();
      await cargarEstado();
      mostrarMensaje("success", t("subasta.winnerWithdrawSuccess"));
    } catch (error) {
      console.error("Error al retirar fondos del ganador:", error);
      mostrarMensaje("danger", obtenerMensajeErrorTraducido(error, t, t("subasta.winnerWithdrawError")));
    }
  };

  const pujar = async () => {
    if (!contractRef.current) return;
    if (esOwner) {
      mostrarMensaje("warning", t("subasta.sellerCannotBid"));
      return;
    }
    if (finalizada) {
      mostrarMensaje("warning", t("subasta.auctionEndedNoBids"));
      return;
    }
    if (!esMontoValidoEnUnidad(montoBNB, unidad)) {
      mostrarMensaje("warning", t("subasta.invalidBidAmountByUnit", { unit: UNIDADES[unidad].label }));
      return;
    }

    try {
      const montoEnWei = convertirAWei(montoBNB.replace(",", "."), unidad);
      const tx = await contractRef.current.pujar({
        value: montoEnWei,
      });
      mostrarMensaje("info", t("subasta.bidSent"));
      await tx.wait();
      setMontoBNB("");
      await cargarEstado();
      mostrarMensaje("success", t("subasta.bidSuccess"));
    } catch (error) {
      console.error("Error al pujar:", error);
      mostrarMensaje("danger", obtenerMensajeErrorTraducido(error, t, t("subasta.bidError")));
    }
  };

  const retirar = async () => {
    if (!contractRef.current) return;
    if (!finalizada) {
      mostrarMensaje("warning", t("subasta.auctionNotFinished"));
      return;
    }
    if (esOwner) {
      mostrarMensaje("warning", t("subasta.sellerUseWinnerWithdraw"));
      return;
    }
    if (Number(miPuja) <= 0) {
      mostrarMensaje("warning", t("subasta.noBidOrWithdrawn"));
      return;
    }

    try {
      const tx = await contractRef.current.retirarNoGanador();
      mostrarMensaje("info", t("subasta.withdrawSent"));
      await tx.wait();
      await cargarEstado();
      mostrarMensaje("success", t("subasta.withdrawSuccess"));
    } catch (error) {
      console.error("Error al retirar:", error);
      mostrarMensaje("danger", obtenerMensajeErrorTraducido(error, t, t("subasta.withdrawError")));
    }
  };

  const consultarGanador = async () => {
    if (!contractRef.current) return;

    try {
      const g = await contractRef.current.ganador();
      setGanador(g);
      mostrarMensaje("success", t("subasta.winnerConsulted"));
    } catch (error) {
      console.error("Error al consultar ganador:", error);
      mostrarMensaje("warning", obtenerMensajeErrorTraducido(error, t, t("subasta.winnerConsultError")));
    }
  };

  useEffect(() => {
    const init = async () => {
      const account = await configureBlockchain();
      await cargarEstado(account);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractAddress]);

  useEffect(() => {
    const timer = setInterval(() => {
      setAhora(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return {
    cuenta,
    owner,
    producto,
    highestBid,
    highestBidder,
    miPuja,
    endTime,
    extensionWindow,
    ahora,
    finalizada,
    ganador,
    fondosGanadorRetirados,
    historialPujas,
    cargandoPujas,
    montoBNB,
    unidad,
    contractAddress,
    mensaje,
    esOwner,
    setMontoBNB,
    setUnidad,
    onChangeMonto,
    pujar,
    retirar,
    retirarFondosGanador,
    consultarGanador,
    cargarEstado,
    cargarHistorialPujas,
  };
}
