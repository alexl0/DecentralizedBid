import { ethers } from "ethers";

export const limpiarMensajeRevert = (rawMessage) => {
  if (!rawMessage || !rawMessage.includes("execution reverted")) return null;

  let parte = rawMessage.split("execution reverted:")[1] || rawMessage.split("execution reverted")[1] || "";
  parte = parte.trim();
  parte = parte.replace(/: 0x[0-9a-fA-F]+$/, "").trim();

  if (!parte) return "Transaccion revertida";
  return parte.startsWith("Error:") ? parte : `Error: ${parte}`;
};

export const obtenerMensajeError = (error, fallback) => {
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

  return fallback;
};

export const tiempoRestanteTexto = (endTime, ahora) => {
  if (!endTime) return "-";
  const restante = endTime - ahora;
  if (restante <= 0) return "Finalizada";

  const horas = Math.floor(restante / 3600);
  const minutos = Math.floor((restante % 3600) / 60);
  const segundos = restante % 60;
  return `${horas}h ${minutos}m ${segundos}s`;
};

export const esMontoValido = (valor) => {
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

export const normalizarMontoInput = (value) => {
  const normalizado = value.replace(",", ".");
  return /^\d*(\.\d*)?$/.test(normalizado) ? normalizado : null;
};
