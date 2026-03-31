import { esMontoValido, tiempoRestanteTexto, UNIDADES, esMontoValidoEnUnidad, convertirDesdeWei, convertirAWei } from "@/features/subasta/utils";
import { CONTRACT_ADDRESS } from "@/features/subasta/config";

export default function SubastaView(props) {
  const {
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
    mensaje,
    esOwner,
    onChangeMonto,
    setUnidad,
    pujar,
    retirar,
    retirarFondosGanador,
    consultarGanador,
    cargarEstado,
    cargarHistorialPujas,
  } = props;

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
          <p className="mb-1"><strong>Ventana anti-sniping:</strong> {Math.floor(extensionWindow / 60)} min</p>
          <p className="mb-3"><strong>Tiempo restante:</strong> {tiempoRestanteTexto(endTime, ahora)}</p>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => cargarEstado()}>
            Recargar estado
          </button>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h2 className="h5 card-title">Pujar</h2>
          
          {esOwner && (
            <div className="alert alert-warning mb-3" role="alert">
              <strong>⚠️ No puedes pujar:</strong> Eres el vendedor de esta subasta. Los usuarios no pueden pujar en sus propias subastas.
            </div>
          )}
          
          {!esOwner && !finalizada && (
            <div className="row g-2 align-items-end">
              <div className="col-12 col-md-2">
                <label className="form-label">Unidad</label>
                <select
                  className="form-select"
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value)}
                >
                  {Object.entries(UNIDADES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="col-12 col-md-3">
                <label className="form-label">Cantidad en {UNIDADES[unidad].label}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="form-control"
                  value={montoBNB}
                  onChange={(e) => onChangeMonto(e.target.value)}
                  placeholder="Ej: 0.01"
                />
              </div>
              
              <div className="col-12 col-md-3">
                <label className="form-label">Equivalente en BNB</label>
                <input
                  type="text"
                  className="form-control"
                  value={montoBNB && esMontoValidoEnUnidad(montoBNB, unidad) 
                    ? convertirDesdeWei(convertirAWei(montoBNB.replace(",", "."), unidad), "BNB").substring(0, 18) 
                    : "-"}
                  disabled
                  readOnly
                  style={{ backgroundColor: "#f8f9fa", cursor: "not-allowed" }}
                />
              </div>
              
              <div className="col-12 col-md-auto">
                <button
                  className="btn btn-primary"
                  onClick={pujar}
                  disabled={finalizada || !esMontoValidoEnUnidad(montoBNB, unidad)}
                >
                  Enviar puja
                </button>
              </div>
            </div>
          )}
          
          {finalizada && !esOwner && (
            <div className="alert alert-info mb-0" role="alert">
              La subasta ha finalizado. No se aceptan más pujas.
            </div>
          )}
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

      <div className="card mt-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h2 className="h5 card-title mb-0">Historial de pujas</h2>
            <button className="btn btn-outline-secondary btn-sm" onClick={cargarHistorialPujas}>
              Recargar pujas
            </button>
          </div>

          {cargandoPujas ? <p className="mb-0">Cargando pujas...</p> : null}

          {!cargandoPujas && historialPujas.length === 0 ? (
            <p className="mb-0">Aun no hay pujas registradas.</p>
          ) : null}

          {!cargandoPujas && historialPujas.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-sm table-striped align-middle mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Direccion</th>
                    <th>Importe (BNB)</th>
                  </tr>
                </thead>
                <tbody>
                  {historialPujas.map((puja, index) => (
                    <tr key={puja.txHash + index}>
                      <td>{index + 1}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{puja.bidder}</td>
                      <td>{puja.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
