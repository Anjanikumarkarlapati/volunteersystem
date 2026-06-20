import { query } from '../config/db.js';

export const findOrganizationByUserId = async userId => {
  const { rows } = await query(
    `SELECT o.*, u.name AS account_name, u.email, u.status AS user_status
     FROM organizations o
     JOIN users u ON u.id = o.user_id
     WHERE o.user_id = $1`,
    [userId]
  );

  return rows[0];
};

export const findOrganizationById = async id => {
  const { rows } = await query(
    `SELECT o.*, u.name AS account_name, u.email, u.status AS user_status
     FROM organizations o
     JOIN users u ON u.id = o.user_id
     WHERE o.id = $1`,
    [id]
  );

  return rows[0];
};

export const listOrganizations = async ({ limit, offset, search, verified }) => {
  const conditions = [];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(
      `(o.name ILIKE $${values.length} OR o.city ILIKE $${values.length} OR o.state ILIKE $${values.length})`
    );
  }

  if (verified !== undefined) {
    values.push(verified);
    conditions.push(`o.verified = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [{ rows }, countResult] = await Promise.all([
    query(
      `SELECT o.*, u.email, u.status AS user_status,
        COUNT(op.id)::int AS opportunity_count
       FROM organizations o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN opportunities op ON op.organization_id = o.id
       ${where}
       GROUP BY o.id, u.email, u.status
       ORDER BY o.created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    ),
    query(
      `SELECT COUNT(*)::int AS total
       FROM organizations o
       JOIN users u ON u.id = o.user_id
       ${where}`,
      values
    ),
  ]);

  return {
    organizations: rows,
    total: countResult.rows[0].total,
  };
};
