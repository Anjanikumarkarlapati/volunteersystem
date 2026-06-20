import { query } from '../config/db.js';
import { sendEmail } from './email.service.js';

export const createNotification = async ({
  userId,
  title,
  message,
  type = 'info',
  metadata = {},
}) => {
  const { rows } = await query(
    `INSERT INTO notifications (user_id, title, message, type, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, title, message, type, JSON.stringify(metadata)]
  );

  return rows[0];
};

export const notifyUser = async ({
  userId,
  email,
  title,
  message,
  type = 'info',
  metadata = {},
}) => {
  const notification = await createNotification({ userId, title, message, type, metadata });
  await sendEmail({ to: email, subject: title, text: message }).catch(error => {
    console.error('Email notification failed', error);
  });

  return notification;
};
