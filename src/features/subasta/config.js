export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

// RPC publica para leer eventos de puja sin depender de planes de API.
export const EVENTS_RPC_URL =
  process.env.NEXT_PUBLIC_EVENTS_RPC_URL || "https://bsc-testnet.publicnode.com";

export const SUBASTA_ABI = [
  "function owner() view returns (address)",
  "function producto() view returns (string)",
  "function endTime() view returns (uint256)",
  "function extensionWindow() view returns (uint256)",
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
  "event SubastaExtendida(uint256 nuevoEndTime)",
];
