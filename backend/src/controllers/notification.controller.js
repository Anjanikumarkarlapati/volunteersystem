import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createNotification } from '../services/notification.service.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT *, read_at IS NOT NULL AS is_read
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 100`,
    [req.user.id]
  );

  res.json(rows);
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE notifications
     SET read_at = COALESCE(read_at, NOW())
     WHERE id = $1 AND user_id = $2
     RETURNING *, read_at IS NOT NULL AS is_read`,
    [req.params.id, req.user.id]
  );

  if (!rows[0]) {
    throw new ApiError(404, 'Notification not found');
  }

  res.json(rows[0]);
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await query(
    `UPDATE notifications
     SET read_at = COALESCE(read_at, NOW())
     WHERE user_id = $1`,
    [req.user.id]
  );

  res.status(204).send();
});

export const createAdminNotification = asyncHandler(async (req, res) => {
  const notification = await createNotification({
    userId: req.body.user_id,
    title: req.body.title,
    message: req.body.message,
    type: req.body.type || 'info',
    metadata: req.body.metadata || {},
  });

  res.status(201).json(notification);
});
