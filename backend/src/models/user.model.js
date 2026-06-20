import { query } from '../config/db.js';

export const userPublicFields =
  'id, name, email, role, status, last_login_at, created_at, updated_at';

export const findUserByEmail = async email => {
  const { rows } = await query('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
  return rows[0];
};

export const findUserById = async id => {
  const { rows } = await query(`SELECT ${userPublicFields} FROM users WHERE id = $1`, [id]);
  return rows[0];
};

export const findUserWithPasswordById = async id => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0];
};

export const findUserByProvider = async (provider, providerId) => {
  const { rows } = await query(`SELECT * FROM users WHERE provider = $1 AND provider_id = $2`, [
    provider,
    providerId,
  ]);
  return rows[0];
};

export const updateRefreshTokenHash = async (userId, refreshTokenHash) => {
  await query('UPDATE users SET refresh_token_hash = $2 WHERE id = $1', [userId, refreshTokenHash]);
};

export const listUsers = async ({ limit, offset, role, status, search }) => {
  const conditions = [];
  const values = [];

  if (role) {
    values.push(role);
    conditions.push(`role = $${values.length}`);
  }

  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    const idx = values.length;
    values.push(`%${search}%`);
    conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx + 1})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [{ rows }, countResult] = await Promise.all([
    query(
      `SELECT ${userPublicFields}
       FROM users
       ${where}
       ORDER BY created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    ),
    query(`SELECT COUNT(*)::int AS total FROM users ${where}`, values),
  ]);

  return {
    users: rows,
    total: countResult.rows[0].total,
  };
};

export const updateUser = async (userId, fields) => {
  const sets = [];
  const values = [];
  let idx = 1;

  if (fields.name !== undefined) {
    sets.push(`name = $${idx++}`);
    values.push(fields.name);
  }
  if (fields.email !== undefined) {
    sets.push(`email = $${idx++}`);
    values.push(fields.email);
  }

  if (!sets.length) return findUserById(userId);

  values.push(userId);
  const { rows } = await query(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx} RETURNING ${userPublicFields}`,
    values
  );
  return rows[0];
};

export const updatePassword = async (userId, passwordHash) => {
  await query('UPDATE users SET password_hash = $2 WHERE id = $1', [userId, passwordHash]);
};

export const deleteUser = async userId => {
  const { rowCount } = await query('DELETE FROM users WHERE id = $1', [userId]);
  return rowCount > 0;
};

export const updateUserStatus = async (userId, status) => {
  const { rows } = await query(
    `UPDATE users
     SET status = $2
     WHERE id = $1
     RETURNING ${userPublicFields}`,
    [userId, status]
  );

  return rows[0];
};

export const createOAuthUser = async (
  client,
  { name, email, provider, providerId, role, googlePictureUrl }
) => {
  const { rows } = await client.query(
    `INSERT INTO users (name, email, password_hash, role, status, provider, provider_id, google_picture_url)
     VALUES ($1, $2, NULL, $3, 'active', $4, $5, $6)
     RETURNING id, name, email, role, status, created_at, updated_at`,
    [name, email, role, provider, providerId, googlePictureUrl]
  );
  return rows[0];
};

export const linkOAuthProvider = async (userId, provider, providerId, googlePictureUrl) => {
  const { rows } = await query(
    `UPDATE users SET provider = $2, provider_id = $3, google_picture_url = $4 WHERE id = $1 RETURNING ${userPublicFields}`,
    [userId, provider, providerId, googlePictureUrl]
  );
  return rows[0];
};
