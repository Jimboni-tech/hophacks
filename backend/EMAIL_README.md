Email configuration and testing

The backend can send notification emails when users request completion verification.

Required environment variables (set these in your `.env` for production or development):

- `SMTP_HOST` - SMTP host (e.g. `smtp.sendgrid.net`, `smtp.mailtrap.io`, or `localhost` for MailHog)
- `SMTP_PORT` - SMTP port (e.g. `587`)
- `SMTP_USER` - SMTP username (if required)
- `SMTP_PASS` - SMTP password (if required)
- `EMAIL_FROM` - From header, format: `"Display Name <no-reply@yourdomain.com>"`

Development/testing options

1. MailHog (local, captured messages):

```bash
# run MailHog
docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog

# .env example
SMTP_HOST=localhost
SMTP_PORT=1025
EMAIL_FROM="HopHacks <no-reply@local>"
```

Open MailHog UI at `http://localhost:8025` to see sent messages.

2. Mailtrap (safe staging SMTP):

- Sign up at https://mailtrap.io and use the SMTP credentials provided in the inbox settings.

3. Ethereal (nodemailer test account) - automatic fallback:

- If `SMTP_HOST`/`SMTP_PORT` are not set or connectivity fails, the backend will create an Ethereal test account and print a preview URL for the sent message in the server logs.

Notes

- Do not commit secrets to source control. Keep `.env` out of git.
- For production sending, prefer SendGrid/Mailgun/AWS SES and verify your sending domain/email. Add SPF/DKIM DNS records for better deliverability.
