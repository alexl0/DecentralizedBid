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

  if (error?.errorName) return `Error: ${error.errorName}`;
  if (error?.error?.errorName) return `Error: ${error.error.errorName}`;

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

export const obtenerCodigoErrorBlockchain = (error) => {
  const code = error?.errorName || error?.error?.errorName;
  if (code && code !== "Error") return code;

  const reason = error?.reason || error?.error?.message || error?.data?.message || error?.message || "";
  const match = reason.match(/([A-Za-z_][A-Za-z0-9_]*)\(\)/);
  if (!match) return null;
  return match[1] === "Error" ? null : match[1];
};

export const obtenerMensajeErrorTraducido = (error, t, fallback) => {
  const code = obtenerCodigoErrorBlockchain(error);
  if (code) {
    const translated = t(`errors.${code}`);
    if (translated !== `errors.${code}`) return translated;
  }

  return obtenerMensajeError(error, fallback);
};

export const tiempoRestanteTexto = (endTime, ahora, finishedLabel = "Finalizada") => {
  if (!endTime) return "-";
  const restante = endTime - ahora;
  if (restante <= 0) return finishedLabel;

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

export const UNIDADES = {
  BNB: { label: "BNB", decimals: 18 },
  mBNB: { label: "mBNB", decimals: 15 },
  Gwei: { label: "Gwei", decimals: 9 },
  Wei: { label: "Wei", decimals: 0 },
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
    const montoNormalizado = monto.replace(",", ".");
    return ethers.utils.parseUnits(montoNormalizado, UNIDADES[unidad].decimals).toString();
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
    return ethers.utils.formatUnits(monto, UNIDADES[unidad].decimals);
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
    const wei = convertirAWei(normalizado, unidad);
    return ethers.BigNumber.from(wei).gt(0);
  } catch {
    return false;
  }
};

