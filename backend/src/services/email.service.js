import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const hasSmtpConfig = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    })
  : null;

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    return { skipped: true, reason: 'SMTP is not configured' };
  }

  return transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    text,
    html,
  });
};
