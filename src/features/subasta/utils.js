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

// Conversões de unidades
export const UNIDADES = {
  BNB: { label: "BNB", factor: "1" },
  mBNB: { label: "mBNB", factor: "0.001" },
  Gwei: { label: "Gwei", factor: "0.000000001" },
  Wei: { label: "Wei", factor: "0.000000000000000001" },
};

/**
 * Convierte un monto desde la unidad especificada a Wei (para el contrato)
 * @param {string} monto - El monto en la unidad especificada
 * @param {string} unidad - La unidad (BNB, mBNB, Gwei, Wei)
 * @returns {string} - El monto en Wei (BigNumber como string)
 */
export const convertirAWei = (monto, unidad) => {
  if (!monto || !unidad || !UNIDADES[unidad]) {
    throw new Error("Monto o unidad inválida");
  }

  try {
    const factor = UNIDADES[unidad].factor;
    const montoNormalizado = monto.replace(",", ".");
    
    // Multiplicar el monto por el factor para convertir a BNB
    const montoEnBNB = (parseFloat(montoNormalizado) * parseFloat(factor)).toString();
    
    // Convertir BNB a Wei
    return ethers.utils.parseEther(montoEnBNB).toString();
  } catch (error) {
    throw new Error("Error al convertir monto: " + error.message);
  }
};

/**
 * Convierte un monto desde Wei a la unidad especificada (para mostrar)
 * @param {string|BigNumber} monto - El monto en Wei
 * @param {string} unidad - La unidad destino (BNB, mBNB, Gwei, Wei)
 * @returns {string} - El monto en la unidad especificada
 */
export const convertirDesdeWei = (monto, unidad) => {
  if (!unidad || !UNIDADES[unidad]) {
    throw new Error("Unidad inválida");
  }

  try {
    const factor = UNIDADES[unidad].factor;
    const montoEnBNB = ethers.utils.formatEther(monto);
    const resultado = (parseFloat(montoEnBNB) / parseFloat(factor)).toString();
    return resultado;
  } catch (error) {
    throw new Error("Error al convertir monto: " + error.message);
  }
};

/**
 * Valida si un monto es válido en la unidad especificada
 * @param {string} valor - El valor a validar
 * @param {string} unidad - La unidad
 * @returns {boolean}
 */
export const esMontoValidoEnUnidad = (valor, unidad) => {
  if (!valor || !unidad || !UNIDADES[unidad]) return false;
  
  const normalizado = valor.replace(",", ".");
  if (!/^\d*(\.\d*)?$/.test(normalizado)) return false;
  if (normalizado === ".") return false;

  try {
    convertirAWei(normalizado, unidad);
    return parseFloat(normalizado) > 0;
  } catch {
    return false;
  }
};

