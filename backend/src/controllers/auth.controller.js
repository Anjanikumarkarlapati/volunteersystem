import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { withTransaction, query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyRefreshToken } from '../utils/jwt.js';
import { env } from '../config/env.js';
import {
  comparePassword,
  hashPassword,
  issueTokenPair,
  issueTokenPairWithClient,
  verifyGoogleIdToken,
  downloadGooglePicture,
} from '../services/auth.service.js';
import {
  deleteUser,
  findUserByEmail,
  findUserWithPasswordById,
  updatePassword,
  updateRefreshTokenHash,
  updateUser as updateUserModel,
  createOAuthUser,
  linkOAuthProvider,
} from '../models/user.model.js';
import { findVolunteerByUserId } from '../models/volunteer.model.js';
import { findOrganizationByUserId } from '../models/organization.model.js';

const toPublicUser = user => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

export const register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    organizationName,
    location,
    skills = [],
    interests = [],
    volunteer_type = null,
  } = req.body;

  if (!['volunteer', 'organization'].includes(role)) {
    throw new ApiError(400, 'Only volunteers and organizations can self-register');
  }

  const result = await withTransaction(async client => {
    const existing = await client.query('SELECT id FROM users WHERE lower(email) = lower($1)', [
      email,
    ]);
    if (existing.rowCount) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    const passwordHash = await hashPassword(password);
    const { rows } = await client.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING id, name, email, role, status, created_at, updated_at`,
      [name, email, passwordHash, role]
    );

    const user = rows[0];

    if (role === 'volunteer') {
      await client.query(
        `INSERT INTO volunteers (user_id, location, skills, interests, volunteer_type)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, location || null, skills, interests, volunteer_type]
      );
    }

    if (role === 'organization') {
      await client.query(
        `INSERT INTO organizations (user_id, name, city, state)
         VALUES ($1, $2, $3, $4)`,
        [user.id, organizationName || name, req.body.city || null, req.body.state || null]
      );
    }

    const tokens = await issueTokenPairWithClient(client, user);
    return { user, tokens };
  });

  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);

  if (!user || !(await comparePassword(password, user.password_hash))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.status !== 'active') {
    throw new ApiError(403, 'Account is not active');
  }

  const tokens = await issueTokenPair(user);
  await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

  res.json({
    user: toPublicUser(user),
    tokens,
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(400, 'Refresh token is required');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_error) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  if (payload.type !== 'refresh') {
    throw new ApiError(401, 'Invalid refresh token type');
  }

  const user = await findUserWithPasswordById(payload.sub);
  if (!user || !user.refresh_token_hash || user.status !== 'active') {
    throw new ApiError(401, 'Refresh token is no longer valid');
  }

  const matches = await comparePassword(refreshToken, user.refresh_token_hash);
  if (!matches) {
    throw new ApiError(401, 'Refresh token is no longer valid');
  }

  const tokens = await issueTokenPair(user);

  res.json({
    user: toPublicUser(user),
    tokens,
  });
});

export const logout = asyncHandler(async (req, res) => {
  await updateRefreshTokenHash(req.user.id, null);
  res.status(204).send();
});

export const me = asyncHandler(async (req, res) => {
  let profile = null;

  if (req.user.role === 'volunteer') {
    profile = await findVolunteerByUserId(req.user.id);
  }

  if (req.user.role === 'organization') {
    profile = await findOrganizationByUserId(req.user.id);
  }

  res.json({
    user: req.user,
    profile,
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  if (!name && !email) {
    throw new ApiError(400, 'Nothing to update');
  }

  if (email) {
    const existing = await findUserByEmail(email);
    if (existing && existing.id !== req.user.id) {
      throw new ApiError(409, 'An account with this email already exists');
    }
  }

  const updated = await updateUserModel(req.user.id, { name, email });
  res.json({ user: updated });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current password and new password are required');
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters');
  }

  const user = await findUserWithPasswordById(req.user.id);
  if (!user || !(await comparePassword(currentPassword, user.password_hash))) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  const passwordHash = await hashPassword(newPassword);
  await updatePassword(req.user.id, passwordHash);

  res.json({ message: 'Password changed successfully' });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await deleteUser(req.user.id);
  res.json({ message: 'Account deleted successfully' });
});

export const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    throw new ApiError(400, 'Google ID token is required');
  }

  const googlePayload = await verifyGoogleIdToken(idToken);
  const { sub: googleId, email, name, picture } = googlePayload;

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    if (existingUser.provider === 'google' && existingUser.provider_id === googleId) {
      const tokens = await issueTokenPair(existingUser);
      await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [existingUser.id]);
      res.json({ user: toPublicUser(existingUser), tokens });
      return;
    }

    if (existingUser.provider && existingUser.provider !== 'google') {
      throw new ApiError(409, 'This email is linked to a different provider');
    }

    res.json({ needsLinking: true, email });
    return;
  }

  const tempToken = jwt.sign(
    { email, name, googleId, picture, type: 'google_oauth_temp' },
    env.jwtAccessSecret,
    { expiresIn: '5m' }
  );

  res.json({ needsRoleSelection: true, tempToken });
});

export const completeGoogleRegistration = asyncHandler(async (req, res) => {
  const { tempToken, role, organizationName, location, city, state } = req.body;

  if (!tempToken || !role) {
    throw new ApiError(400, 'Temp token and role are required');
  }

  let payload;
  try {
    payload = jwt.verify(tempToken, env.jwtAccessSecret);
  } catch {
    throw new ApiError(401, 'Invalid or expired temp token');
  }

  if (payload.type !== 'google_oauth_temp') {
    throw new ApiError(401, 'Invalid temp token type');
  }

  const existingUser = await findUserByEmail(payload.email);
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const result = await withTransaction(async client => {
    const pictureUrl = await downloadGooglePicture(payload.picture, 'temp');

    const user = await createOAuthUser(client, {
      name: payload.name,
      email: payload.email,
      provider: 'google',
      providerId: payload.googleId,
      role,
      googlePictureUrl: pictureUrl,
    });

    if (role === 'volunteer') {
      await client.query(`INSERT INTO volunteers (user_id, location) VALUES ($1, $2)`, [
        user.id,
        location || null,
      ]);
    }

    if (role === 'organization') {
      await client.query(
        `INSERT INTO organizations (user_id, name, city, state) VALUES ($1, $2, $3, $4)`,
        [user.id, organizationName || payload.name, city || null, state || null]
      );
    }

    if (pictureUrl) {
      await client.query('UPDATE users SET google_picture_url = $2 WHERE id = $1', [
        user.id,
        pictureUrl,
      ]);
    }

    const tokens = await issueTokenPairWithClient(client, user);
    return { user, tokens };
  });

  res.status(201).json(result);
});

export const linkGoogleAccount = asyncHandler(async (req, res) => {
  const { idToken, email, password } = req.body;

  if (!idToken || !email || !password) {
    throw new ApiError(400, 'ID token, email, and password are required');
  }

  const user = await findUserByEmail(email);
  if (!user || !(await comparePassword(password, user.password_hash))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.provider) {
    throw new ApiError(409, 'Account already linked to a provider');
  }

  const googlePayload = await verifyGoogleIdToken(idToken);
  const { sub: googleId, picture } = googlePayload;

  const pictureUrl = await downloadGooglePicture(picture, user.id);
  await linkOAuthProvider(user.id, 'google', googleId, pictureUrl);

  const tokens = await issueTokenPair(user);
  res.json({ user: toPublicUser(user), tokens });
});

export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const { notification_preferences } = req.body;

  if (!notification_preferences || typeof notification_preferences !== 'object') {
    throw new ApiError(400, 'Notification preferences object is required');
  }

  const { rows } = await query(
    `UPDATE users SET notification_preferences = $2 WHERE id = $1 RETURNING notification_preferences`,
    [req.user.id, JSON.stringify(notification_preferences)]
  );

  res.json({ notification_preferences: rows[0].notification_preferences });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required');

  const user = await findUserByEmail(email);
  if (!user) {
    return res.json({
      message: 'If an account with that email exists, a reset link has been generated.',
    });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await query('INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)', [
    user.id,
    token,
    expiresAt,
  ]);

  const resetLink = `${env.appUrl || 'http://localhost:5173'}/reset-password?token=${token}`;

  console.log('\\n================================================');
  console.log('🔒 PASSWORD RESET LINK GENERATED 🔒');
  console.log(`To: ${user.email}`);
  console.log(`Link: ${resetLink}`);
  console.log('================================================\\n');

  res.json({ message: 'If an account with that email exists, a reset link has been generated.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new ApiError(400, 'Token and new password are required');
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  const { rows } = await query(
    'SELECT * FROM password_resets WHERE token = $1 AND used = false AND expires_at > NOW()',
    [token]
  );

  if (rows.length === 0) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  const resetRecord = rows[0];

  await withTransaction(async client => {
    const passwordHash = await hashPassword(newPassword);

    await client.query('UPDATE users SET password_hash = $2 WHERE id = $1', [
      passwordHash,
      resetRecord.user_id,
    ]);
    await client.query('UPDATE password_resets SET used = true WHERE id = $1', [resetRecord.id]);
    await client.query('UPDATE users SET refresh_token_hash = NULL WHERE id = $1', [
      resetRecord.user_id,
    ]);
  });

  res.json({ message: 'Password has been successfully reset' });
});
