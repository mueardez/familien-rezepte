/**
 * Google Apps Script, owned by the designated Gmail sender account.
 * Project time zone: Europe/Zurich. Set the script property POLL_DISPATCH_SECRET
 * to the same 32+ character value as the Cloudflare Worker secret.
 */
const FAMILIEN_APP = 'https://familien-rezepte.mueardez.workers.dev';

function sendFridayPoll() {
  const secret = PropertiesService.getScriptProperties().getProperty('POLL_DISPATCH_SECRET');
  if (!secret || secret.length < 32) throw new Error('POLL_DISPATCH_SECRET fehlt.');
  const response = UrlFetchApp.fetch(FAMILIEN_APP + '/api/polls/dispatch', {
    method: 'post',
    headers: { Authorization: 'Bearer ' + secret },
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) throw new Error('Abstimmung konnte nicht eröffnet werden: HTTP ' + response.getResponseCode());
  const poll = JSON.parse(response.getContentText());
  const properties = PropertiesService.getScriptProperties();
  for (const recipient of poll.recipients) {
    const sentKey = 'sent_' + poll.week + '_' + recipient;
    if (properties.getProperty(sentKey)) continue;
    MailApp.sendEmail({
      to: recipient,
      subject: 'Was kochen wir nächste Woche? – Familien-Rezepte',
      body: 'Wähle sieben von zehn Rezepten für die Woche ab ' + poll.week + '.\n\nZur Abstimmung: ' + poll.url + '\n\nBitte melde dich mit deinem Google-Konto an.',
      name: 'Familien-Rezepte',
    });
    properties.setProperty(sentKey, new Date().toISOString());
  }
}

function installFridayTrigger() {
  ScriptApp.getProjectTriggers().filter(trigger => trigger.getHandlerFunction() === 'sendFridayPoll')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('sendFridayPoll').timeBased().onWeekDay(ScriptApp.WeekDay.FRIDAY).atHour(17).create();
}
