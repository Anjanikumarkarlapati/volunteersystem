import path from 'path';
import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const uploadProfileAsset = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'A file is required');
  }

  const fileUrl = `/uploads/profiles/${path.basename(req.file.path)}`;

  if (req.user.role === 'volunteer') {
    await query('UPDATE volunteers SET profile_picture_url = $2 WHERE user_id = $1', [
      req.user.id,
      fileUrl,
    ]);
  }

  if (req.user.role === 'organization') {
    await query('UPDATE organizations SET logo_url = $2 WHERE user_id = $1', [
      req.user.id,
      fileUrl,
    ]);
  }

  res.status(201).json({
    url: fileUrl,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});
