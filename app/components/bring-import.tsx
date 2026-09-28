"use client";

import QRCode from "qrcode";
import Image from "next/image";
import { useEffect, useState } from "react";

export function BringImport() {
  const [importData, setImportData] = useState({ deepLink: "", qrCode: "" });
  useEffect(() => {
    const recipeUrl = window.location.href.split("#")[0];
    const target = `https://api.getbring.com/rest/bringrecipes/deeplink?url=${encodeURIComponent(recipeUrl)}&source=web&baseQuantity=3&requestedQuantity=3`;
    QRCode.toDataURL(target, { width: 360, margin: 1, errorCorrectionLevel: "M", color: { dark: "#24352d", light: "#ffffff" } })
      .then((qrCode) => setImportData({ deepLink: target, qrCode }))
      .catch(() => setImportData({ deepLink: target, qrCode: "" }));
  }, []);
  return (
    <aside className="bring-panel" aria-labelledby="bring-heading">
      <div className="bring-copy"><p className="eyebrow">Einkaufsliste</p><h2 id="bring-heading">Zutaten in Bring! übernehmen</h2><p>Am Handy antippen oder den QR-Code mit einem zweiten Gerät scannen. Bring! öffnet das Rezept und übernimmt die Zutaten.</p>{importData.deepLink && <a className="bring-button" href={importData.deepLink}>In Bring! übernehmen <span aria-hidden="true">↗</span></a>}</div>
      <div className="qr-wrap">{importData.qrCode ? <Image src={importData.qrCode} alt="QR-Code zum Import dieses Rezepts in Bring!" width={180} height={180} unoptimized /> : <div className="qr-placeholder" aria-hidden="true" />}<span>QR-Code für dieses Rezept</span></div>
    </aside>
  );
}
