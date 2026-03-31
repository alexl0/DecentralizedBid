import Link from "next/link";
import { tiempoRestanteTexto, UNIDADES, esMontoValidoEnUnidad, convertirDesdeWei, convertirAWei } from "@/features/subasta/utils";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/i18n/provider";

export default function SubastaView(props) {
  const { t } = useI18n();
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
    contractAddress,
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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Link href="/" className="btn btn-outline-dark btn-sm rounded-pill px-3">
          {t("ui.home")}
        </Link>
        <div className="d-flex gap-2 align-items-center">
          <Link href="/subastas" className="btn btn-outline-primary btn-sm rounded-pill px-3">
            {t("ui.auctionsHub")}
          </Link>
          <LanguageSwitcher />
        </div>
      </div>

      <h1 className="mb-3">{t("ui.decentralizedAuction")}</h1>

      {mensaje.texto && (
        <div className={alertClass[mensaje.tipo] || "alert alert-secondary"} role="alert">
          {mensaje.texto}
        </div>
      )}

      <div className="card mb-3">
        <div className="card-body">
          <h2 className="h5 card-title">{t("ui.connection")}</h2>
          <p className="mb-1"><strong>{t("ui.account")}:</strong> {cuenta || "-"}</p>
          <p className="mb-1"><strong>{t("ui.owner")}:</strong> {owner || "-"}</p>
          <p className="mb-0"><strong>{t("ui.contract")}:</strong> {contractAddress}</p>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h2 className="h5 card-title">{t("ui.state")}</h2>
          <p className="mb-1"><strong>{t("ui.product")}:</strong> {producto || "-"}</p>
          <p className="mb-1"><strong>{t("ui.highestBid")}:</strong> {highestBid} BNB</p>
          <p className="mb-1"><strong>{t("ui.bestBidder")}:</strong> {highestBidder || "-"}</p>
          <p className="mb-1"><strong>{t("ui.myBid")}:</strong> {miPuja} BNB</p>
          <p className="mb-1"><strong>{t("ui.endsAt")}:</strong> {endTime ? new Date(endTime * 1000).toLocaleString() : "-"}</p>
          <p className="mb-1"><strong>{t("ui.antiSnipingWindow")}:</strong> {Math.floor(extensionWindow / 60)} min</p>
          <p className="mb-3"><strong>{t("ui.remainingTime")}:</strong> {tiempoRestanteTexto(endTime, ahora, t("ui.finished"))}</p>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => cargarEstado()}>
            {t("ui.reloadState")}
          </button>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h2 className="h5 card-title">{t("ui.bid")}</h2>
          
          {esOwner && (
            <div className="alert alert-warning mb-3" role="alert">
              <strong>{t("ui.ownerCannotBidTitle")}:</strong> {t("ui.ownerCannotBidBody")}
            </div>
          )}
          
          {!esOwner && !finalizada && (
            <div className="row g-2 align-items-end">
              <div className="col-12 col-md-2">
                <label className="form-label">{t("ui.unit")}</label>
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
                <label className="form-label">{t("ui.amountInUnit", { unit: UNIDADES[unidad].label })}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="form-control"
                  value={montoBNB}
                  onChange={(e) => onChangeMonto(e.target.value)}
                  placeholder={t("ui.bidPlaceholder")}
                />
              </div>
              
              <div className="col-12 col-md-3">
                <label className="form-label">{t("ui.equivalentInBnb")}</label>
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
                  {t("ui.sendBid")}
                </button>
              </div>
            </div>
          )}
          
          {finalizada && !esOwner && (
            <div className="alert alert-info mb-0" role="alert">
              {t("ui.auctionEndedInfo")}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2 className="h5 card-title">{t("ui.postAuction")}</h2>
          <div className="d-flex flex-wrap gap-2 mb-3">
            <button className="btn btn-outline-primary" onClick={consultarGanador}>
              {t("ui.consultWinner")}
            </button>
            {ganador && ganador.toLowerCase() === cuenta.toLowerCase() ? (
              <div className="alert alert-success mb-0" role="alert">
                {t("ui.winnerMessage")}
              </div>
            ) : (
              <button className="btn btn-outline-success" onClick={retirar} disabled={!finalizada || esOwner || Number(miPuja) <= 0}>
                {t("ui.withdrawNonWinner")}
              </button>
            )}
            {finalizada && owner && cuenta.toLowerCase() === owner.toLowerCase() ? (
              <button
                className="btn btn-warning"
                onClick={retirarFondosGanador}
                disabled={fondosGanadorRetirados || Number(highestBid) <= 0}
              >
                {fondosGanadorRetirados ? t("ui.winnerFundsWithdrawn") : t("ui.withdrawWinnerFundsSeller")}
              </button>
            ) : null}
          </div>

          {ganador && (
            <p className="mb-0">
              <strong>{t("ui.winner")}:</strong> {ganador}
            </p>
          )}
        </div>
      </div>

      <div className="card mt-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h2 className="h5 card-title mb-0">{t("ui.bidHistory")}</h2>
            <button className="btn btn-outline-secondary btn-sm" onClick={cargarHistorialPujas}>
              {t("ui.reloadBids")}
            </button>
          </div>

          {cargandoPujas ? <p className="mb-0">{t("ui.loadingBids")}</p> : null}

          {!cargandoPujas && historialPujas.length === 0 ? (
            <p className="mb-0">{t("ui.noBidsYet")}</p>
          ) : null}

          {!cargandoPujas && historialPujas.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-sm table-striped align-middle mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t("ui.address")}</th>
                    <th>{t("ui.amountBnb")}</th>
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
