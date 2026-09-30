/** Inline styles and table layout keep the invitation usable in email clients. */
export function pollEmail(week: string, url: string): string {
  const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
  const date = new Date(`${week}T12:00:00Z`).toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Zurich' });
  const link = escape(url);
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f7f7;color:#032f35;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">Zehn Rezeptideen warten auf dich. Wähle deine sieben Favoriten für die Woche ab ${escape(date)}.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0f7f7;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;">
<tr><td style="padding:0 8px 24px;font-size:19px;font-weight:bold;">Familien-Rezepte</td></tr>
<tr><td style="background:#032f35;color:#ffffff;padding:36px 28px;border-radius:14px 14px 0 0;">
<p style="margin:0 0 20px;color:#d5ee65;font-size:12px;letter-spacing:2px;">EURE NÄCHSTE WOCHE</p>
<h1 style="margin:0 0 20px;font-size:36px;line-height:1.15;font-weight:400;">Was kommt<br>auf den Tisch?</h1>
<p style="margin:0;color:#c7dcdd;font-size:16px;line-height:1.6;">Woche ab ${escape(date)}</p></td></tr>
<tr><td style="background:#ffffff;padding:30px 28px;border:1px solid #ccdddd;border-top:0;border-radius:0 0 14px 14px;">
<p style="margin:0 0 22px;font-size:17px;line-height:1.65;">Zehn Rezeptideen stehen bereit. Wähle deine <strong>sieben Favoriten</strong> und plant gemeinsam, was nächste Woche gekocht wird.</p>
<table role="presentation" cellspacing="0" cellpadding="0"><tr><td bgcolor="#d5ee65" style="border-radius:8px;"><a href="${link}" style="display:inline-block;padding:16px 24px;color:#032f35;font-size:16px;font-weight:bold;text-decoration:none;border:1px solid #d5ee65;border-radius:8px;">Rezepte auswählen &rarr;</a></td></tr></table>
<p style="margin:26px 0 0;font-size:14px;line-height:1.7;color:#516d70;">Sobald ihr beide abgestimmt habt, landen eure gemeinsamen Favoriten auf der Wochenliste. Fehlende Plätze ergänzt die App aus euren übrigen ausgewählten Rezepten.</p>
<p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#516d70;">Bitte melde dich mit deinem freigeschalteten Google-Konto an.</p></td></tr>
<tr><td style="padding:24px 8px;font-size:12px;line-height:1.7;color:#516d70;">Gemeinsam auswählen. Entspannt einkaufen.<br>Falls der Button nicht funktioniert:<br><a href="${link}" style="color:#12626a;word-break:break-all;">${link}</a></td></tr>
</table></td></tr></table></body></html>`;
}
