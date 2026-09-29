/**
 * Run installMailTrigger once after updating this script.
 * The day/time are then controlled exclusively in the app's administration.
 * Keep the existing script property POLL_DISPATCH_SECRET (32+ characters).
 */
const FAMILIEN_APP = 'https://familien-rezepte.mueardez.workers.dev';

function sendScheduledPoll() { sendPoll_(true); }
// Manual test; an existing legacy clock trigger respects the configured schedule.
function sendFridayPoll(event) { sendPoll_(Boolean(event && event.triggerUid)); }

function sendPoll_(scheduled) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const properties = PropertiesService.getScriptProperties();
    const secret = properties.getProperty('POLL_DISPATCH_SECRET');
    if (!secret || secret.length < 32) throw new Error('POLL_DISPATCH_SECRET fehlt.');
    const response = UrlFetchApp.fetch(FAMILIEN_APP + '/api/polls/dispatch', {
      method: 'post', contentType: 'application/json', payload: JSON.stringify({ scheduled: scheduled }),
      headers: { Authorization: 'Bearer ' + secret }, muteHttpExceptions: true,
    });
    if (response.getResponseCode() !== 200) throw new Error('Abstimmung konnte nicht eröffnet werden: HTTP ' + response.getResponseCode());
    const poll = JSON.parse(response.getContentText());
    if (!poll.due) return;
    for (const recipient of poll.recipients) {
      const sentKey = 'sent_' + poll.week + '_' + recipient;
      if (properties.getProperty(sentKey)) continue;
      MailApp.sendEmail({
        to: recipient, subject: 'Was kochen wir nächste Woche? – Familien-Rezepte',
        body: 'Wähle sieben von zehn Rezepten für die Woche ab ' + poll.week + '.\n\nZur Abstimmung: ' + poll.url + '\n\nBitte melde dich mit deinem Google-Konto an.',
        name: 'Familien-Rezepte',
      });
      properties.setProperty(sentKey, new Date().toISOString());
    }
  } finally { lock.releaseLock(); }
}

function installMailTrigger() {
  ScriptApp.getProjectTriggers().filter(trigger => ['sendFridayPoll', 'sendScheduledPoll'].includes(trigger.getHandlerFunction()))
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('sendScheduledPoll').timeBased().everyMinutes(5).create();
}
// Compatibility with the original installation instructions.
function installFridayTrigger() { installMailTrigger(); }
