import { query } from '../config/db.js';

export const findVolunteerByUserId = async userId => {
  const { rows } = await query(
    `SELECT v.*, u.name, u.email, u.status AS user_status
     FROM volunteers v
     JOIN users u ON u.id = v.user_id
     WHERE v.user_id = $1`,
    [userId]
  );

  return rows[0];
};

export const findVolunteerById = async id => {
  const { rows } = await query(
    `SELECT v.*, u.name, u.email, u.status AS user_status
     FROM volunteers v
     JOIN users u ON u.id = v.user_id
     WHERE v.id = $1`,
    [id]
  );

  return rows[0];
};

export const listVolunteers = async ({ limit, offset, search, skill }) => {
  const conditions = [];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(
      `(u.name ILIKE $${values.length} OR u.email ILIKE $${values.length} OR v.location ILIKE $${values.length})`
    );
  }

  if (skill) {
    values.push([skill]);
    conditions.push(`v.skills && $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [{ rows }, countResult] = await Promise.all([
    query(
      `SELECT v.*, u.name, u.email, u.status AS user_status
       FROM volunteers v
       JOIN users u ON u.id = v.user_id
       ${where}
       ORDER BY v.created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    ),
    query(
      `SELECT COUNT(*)::int AS total
       FROM volunteers v
       JOIN users u ON u.id = v.user_id
       ${where}`,
      values
    ),
  ]);

  return {
    volunteers: rows,
    total: countResult.rows[0].total,
  };
};
