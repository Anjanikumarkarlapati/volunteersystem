import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/jwt.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication token is required');
  }

  const token = header.slice(7);
  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch (_error) {
    throw new ApiError(401, 'Invalid or expired authentication token');
  }

  const { rows } = await query(
    `SELECT id, name, email, role, status
     FROM users
     WHERE id = $1`,
    [payload.sub]
  );

  const user = rows[0];
  if (!user || user.status !== 'active') {
    throw new ApiError(401, 'User is not active');
  }

  req.user = user;
  next();
});

export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }

    next();
  };
