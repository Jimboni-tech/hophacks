#!/usr/bin/env node
require('dotenv').config();
const nodemailer = require('nodemailer');

async function main() {
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER || 'no-reply@example.com';
  const toArg = process.argv[2] || process.env.TEST_EMAIL_TO;

  if (!toArg) {
    console.error('Usage: TEST_EMAIL_TO in .env or pass recipient as first arg: node scripts/test-smtp.js you@example.com');
    process.exit(2);
  }

  console.log('SMTP Host:', SMTP_HOST || '(not set)');
  console.log('SMTP Port:', SMTP_PORT || '(not set)');
  console.log('SMTP User:', SMTP_USER ? SMTP_USER.replace(/(.{3}).+(.{3})/, '$1***$2') : '(not set)');

  let transporter;
  if (SMTP_HOST && SMTP_PORT) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
  } else {
    console.log('No SMTP configured — creating Ethereal test account for development');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });
  }

  try {
    console.log('Verifying transporter...');
    await transporter.verify();
    console.log('SMTP verification OK — sending test email...');
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: toArg,
      subject: 'Test email from hophacks SMTP tester',
      text: 'This is a test email sent by backend/scripts/test-smtp.js',
    });
    console.log('Message sent:', info.messageId);
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log('Preview URL:', preview);
  } catch (e) {
    console.error('SMTP test failed:', e && e.message ? e.message : e);
    if (e && e.response) console.error('Response:', e.response);
    process.exitCode = 1;
  }
}

main().catch((e) => { console.error('Unexpected error', e); process.exit(1); });
