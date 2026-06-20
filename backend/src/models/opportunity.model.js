import { query } from '../config/db.js';

export const findOpportunityById = async id => {
  const { rows } = await query(
    `SELECT op.*, org.name AS organization_name, org.user_id AS organization_user_id,
      COUNT(app.id)::int AS applications_count,
      COUNT(app.id) FILTER (WHERE app.status = 'approved')::int AS approved_count
     FROM opportunities op
     JOIN organizations org ON org.id = op.organization_id
     LEFT JOIN applications app ON app.opportunity_id = op.id
     WHERE op.id = $1
     GROUP BY op.id, org.name, org.user_id`,
    [id]
  );

  return rows[0];
};

export const canManageOpportunity = async (user, opportunityId) => {
  if (user.role === 'admin') {
    return true;
  }

  const opportunity = await findOpportunityById(opportunityId);
  return Boolean(opportunity && opportunity.organization_user_id === user.id);
};
