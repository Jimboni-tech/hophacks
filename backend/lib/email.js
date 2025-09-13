const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || (SMTP_USER || 'no-reply@example.com');

let transporterPromise = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (SMTP_HOST && SMTP_PORT) {
      // try configured SMTP
      try {
        const t = nodemailer.createTransport({
          host: SMTP_HOST,
          port: SMTP_PORT,
          secure: SMTP_PORT === 465,
          auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
        });
        // verify connection
        await t.verify();
        return { transporter: t, testAccount: null };
      } catch (e) {
        console.error('Configured SMTP failed to verify, falling back to Ethereal test account', e);
      }
    }

    // fallback to Ethereal (development) if SMTP not configured or verification failed
    const testAccount = await nodemailer.createTestAccount();
    const t = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });
    return { transporter: t, testAccount };
  })();

  return transporterPromise;
}

async function sendMail({ to, subject, html, text }) {
  const { transporter, testAccount } = await getTransporter();
  if (!transporter) throw new Error('No transporter available');
  const info = await transporter.sendMail({ from: EMAIL_FROM, to, subject, text, html });
  let previewUrl = null;
  try {
    previewUrl = nodemailer.getTestMessageUrl(info);
  } catch (e) {
    // ignore
  }
  return { info, previewUrl };
}

module.exports = { sendMail };
