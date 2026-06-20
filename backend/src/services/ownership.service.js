import { query } from '../config/db.js';

export const getOrganizationForUser = async userId => {
  const { rows } = await query('SELECT * FROM organizations WHERE user_id = $1', [userId]);
  return rows[0];
};

export const canManageOrganizationResource = async ({ user, organizationId }) => {
  if (user.role === 'admin') {
    return true;
  }

  const organization = await getOrganizationForUser(user.id);
  return Boolean(organization && organization.id === organizationId);
};

export const getEventWithOrganization = async eventId => {
  const { rows } = await query(
    `SELECT e.*, org.user_id AS organization_user_id, org.name AS organization_name
     FROM events e
     JOIN organizations org ON org.id = e.organization_id
     WHERE e.id = $1`,
    [eventId]
  );

  return rows[0];
};
