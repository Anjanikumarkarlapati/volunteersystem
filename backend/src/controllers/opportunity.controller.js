import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import { findOpportunityById, canManageOpportunity } from '../models/opportunity.model.js';
import { getOrganizationForUser } from '../services/ownership.service.js';

const updateableFields = [
  'title',
  'description',
  'category',
  'required_skills',
  'location',
  'is_remote',
  'start_date',
  'end_date',
  'capacity',
  'hours_estimate',
  'latitude',
  'longitude',
  'urgency_level',
  'status',
];

const buildOpportunityFilters = requestQuery => {
  const values = [];
  const conditions = [];

  if (requestQuery.search) {
    values.push(`%${requestQuery.search}%`);
    conditions.push(
      `(op.title ILIKE $${values.length} OR op.description ILIKE $${values.length} OR org.name ILIKE $${values.length})`
    );
  }

  if (requestQuery.category) {
    values.push(requestQuery.category);
    conditions.push(`lower(op.category) = lower($${values.length})`);
  }

  if (requestQuery.location) {
    values.push(`%${requestQuery.location}%`);
    conditions.push(`op.location ILIKE $${values.length}`);
  }

  if (requestQuery.skill) {
    values.push([requestQuery.skill]);
    conditions.push(`op.required_skills && $${values.length}`);
  }

  if (requestQuery.remote !== undefined) {
    values.push(requestQuery.remote === 'true');
    conditions.push(`op.is_remote = $${values.length}`);
  }

  if (requestQuery.startDate) {
    values.push(requestQuery.startDate);
    conditions.push(`op.start_date >= $${values.length}`);
  }

  if (requestQuery.endDate) {
    values.push(requestQuery.endDate);
    conditions.push(`COALESCE(op.end_date, op.start_date) <= $${values.length}`);
  }

  values.push(requestQuery.status || 'open');
  conditions.push(`op.status = $${values.length}`);

  return { values, conditions };
};

export const listOpportunities = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { values, conditions } = buildOpportunityFilters(req.query);
  const where = `WHERE ${conditions.join(' AND ')}`;

  const [{ rows }, countResult] = await Promise.all([
    query(
      `SELECT op.*, org.name AS organization_name,
        COUNT(app.id)::int AS applications_count,
        COUNT(app.id) FILTER (WHERE app.status = 'approved')::int AS approved_count
       FROM opportunities op
       JOIN organizations org ON org.id = op.organization_id
       LEFT JOIN applications app ON app.opportunity_id = op.id
       ${where}
       GROUP BY op.id, org.name
       ORDER BY op.start_date ASC, op.created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    ),
    query(
      `SELECT COUNT(*)::int AS total
       FROM opportunities op
       JOIN organizations org ON org.id = op.organization_id
       ${where}`,
      values
    ),
  ]);

  res.json({
    data: rows,
    meta: getPaginationMeta(page, limit, countResult.rows[0].total),
  });
});

export const getOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await findOpportunityById(req.params.id);
  if (!opportunity) {
    throw new ApiError(404, 'Opportunity not found');
  }

  res.json(opportunity);
});

export const createOpportunity = asyncHandler(async (req, res) => {
  let organizationId = req.body.organization_id;

  if (req.user.role === 'organization') {
    const organization = await getOrganizationForUser(req.user.id);
    if (!organization) {
      throw new ApiError(404, 'Organization profile not found');
    }
    organizationId = organization.id;
  }

  if (!organizationId) {
    throw new ApiError(400, 'organization_id is required for admin-created opportunities');
  }

  const { rows } = await query(
    `INSERT INTO opportunities (
       organization_id, created_by, title, description, category, required_skills,
       location, is_remote, start_date, end_date, capacity, hours_estimate,
       latitude, longitude, urgency_level, status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [
      organizationId,
      req.user.id,
      req.body.title,
      req.body.description,
      req.body.category,
      req.body.required_skills || [],
      req.body.location || null,
      req.body.is_remote ?? false,
      req.body.start_date,
      req.body.end_date || null,
      req.body.capacity || null,
      req.body.hours_estimate || 0,
      req.body.latitude || null,
      req.body.longitude || null,
      req.body.urgency_level || 'normal',
      req.user.role === 'organization' ? 'pending' : req.body.status || 'open',
    ]
  );

  const newOpp = rows[0];

  if (newOpp.status === 'pending') {
    const adminRes = await query(`SELECT id FROM users WHERE role = 'admin'`);
    for (const admin of adminRes.rows) {
      await query(
        `INSERT INTO notifications (user_id, title, message, type, metadata) VALUES ($1, $2, $3, $4, $5)`,
        [
          admin.id,
          'Pending Opportunity Approval',
          `A new opportunity "${newOpp.title}" requires your approval.`,
          'info',
          JSON.stringify({ opportunity_id: newOpp.id, type: 'approval_required' }),
        ]
      );
    }
  }

  res.status(201).json(newOpp);
});

export const updateOpportunity = asyncHandler(async (req, res) => {
  if (!(await canManageOpportunity(req.user, req.params.id))) {
    throw new ApiError(403, 'You cannot manage this opportunity');
  }

  const sets = [];
  const values = [];

  for (const field of updateableFields) {
    if (req.body[field] !== undefined) {
      values.push(req.body[field]);
      sets.push(`${field} = $${values.length}`);
    }
  }

  if (!sets.length) {
    return res.json(await findOpportunityById(req.params.id));
  }

  values.push(req.params.id);
  const { rows } = await query(
    `UPDATE opportunities
     SET ${sets.join(', ')}
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  if (!rows[0]) {
    throw new ApiError(404, 'Opportunity not found');
  }

  res.json(rows[0]);
});

export const deleteOpportunity = asyncHandler(async (req, res) => {
  if (!(await canManageOpportunity(req.user, req.params.id))) {
    throw new ApiError(403, 'You cannot manage this opportunity');
  }

  const { rows } = await query(
    `UPDATE opportunities
     SET status = 'cancelled'
     WHERE id = $1
     RETURNING *`,
    [req.params.id]
  );

  if (!rows[0]) {
    throw new ApiError(404, 'Opportunity not found');
  }

  res.json(rows[0]);
});

export const listOpportunityApplications = asyncHandler(async (req, res) => {
  if (!(await canManageOpportunity(req.user, req.params.id))) {
    throw new ApiError(403, 'You cannot view applications for this opportunity');
  }

  const { rows } = await query(
    `SELECT app.*, v.user_id AS volunteer_user_id, u.name AS volunteer_name, u.email AS volunteer_email,
      v.skills, v.location
     FROM applications app
     JOIN volunteers v ON v.id = app.volunteer_id
     JOIN users u ON u.id = v.user_id
     WHERE app.opportunity_id = $1
     ORDER BY app.applied_at DESC`,
    [req.params.id]
  );

  res.json(rows);
});

// Hyperlocal: opportunities within radius_km of lat/lng, with a sample fallback
// so the discovery screen still feels useful in development/demo locations.
export const listNearbyOpportunities = asyncHandler(async (req, res) => {
  const requestedLat = parseFloat(req.query.lat);
  const requestedLng = parseFloat(req.query.lng);
  const hasCoordinates = !Number.isNaN(requestedLat) && !Number.isNaN(requestedLng);
  const lat = hasCoordinates ? requestedLat : 30.2672;
  const lng = hasCoordinates ? requestedLng : -97.7431;
  const radius = Math.min(Math.max(parseFloat(req.query.radius_km || '5'), 1), 50);
  const category = req.query.category || null;
  const max_hours = req.query.max_hours ? parseFloat(req.query.max_hours) : null;

  const values = [lat, lng, radius];
  const extra = [];

  if (category) {
    values.push(category);
    extra.push(`lower(op.category) = lower($${values.length})`);
  }
  if (max_hours) {
    values.push(max_hours);
    extra.push(`op.hours_estimate <= $${values.length}`);
  }

  const extraWhere = extra.length ? `AND ${extra.join(' AND ')}` : '';

  // Haversine distance formula in SQL (returns km)
  const { rows } = await query(
    `SELECT op.*, org.name AS organization_name,
       ROUND((
         6371 * acos(
           LEAST(1.0, GREATEST(-1.0,
             cos(radians($1)) * cos(radians(op.latitude)) *
             cos(radians(op.longitude) - radians($2)) +
             sin(radians($1)) * sin(radians(op.latitude))
           ))
         )
       )::numeric, 2) AS distance_km,
       false AS is_sample_distance,
       COUNT(app.id)::int AS applications_count
     FROM opportunities op
     JOIN organizations org ON org.id = op.organization_id
     LEFT JOIN applications app ON app.opportunity_id = op.id
     WHERE op.status = 'open'
       AND op.latitude IS NOT NULL
       AND op.longitude IS NOT NULL
       AND (
         6371 * acos(
           LEAST(1.0, GREATEST(-1.0,
             cos(radians($1)) * cos(radians(op.latitude)) *
             cos(radians(op.longitude) - radians($2)) +
             sin(radians($1)) * sin(radians(op.latitude))
           ))
         )
       ) <= $3
       ${extraWhere}
     GROUP BY op.id, org.name
     ORDER BY distance_km ASC, op.start_date ASC
     LIMIT 50`,
    values
  );

  res.json({
    data: rows,
    center: { lat, lng },
    radius_km: radius,
    used_live_location: hasCoordinates,
  });
});

// Get volunteer heatmap data (52 weeks of activity)
export const getVolunteerHeatmap = asyncHandler(async (req, res) => {
  // Get the volunteer record
  const volResult = await query(`SELECT v.id FROM volunteers v WHERE v.user_id = $1`, [
    req.user.id,
  ]);
  if (!volResult.rows[0]) throw new ApiError(404, 'Volunteer profile not found');
  const volunteerId = volResult.rows[0].id;

  // Weekly attendance counts for last 52 weeks
  const { rows: weekly } = await query(
    `SELECT
       to_char(date_trunc('week', e.start_at), 'YYYY-MM-DD') AS week_start,
       COUNT(*)::int AS events_count,
       COALESCE(SUM(att.hours), 0)::numeric AS hours_total
     FROM attendance att
     JOIN events e ON e.id = att.event_id
     WHERE att.volunteer_id = $1
       AND att.status = 'attended'
       AND e.start_at >= NOW() - INTERVAL '52 weeks'
     GROUP BY week_start
     ORDER BY week_start ASC`,
    [volunteerId]
  );

  // Last activity date for churn risk
  const { rows: lastActivity } = await query(
    `SELECT MAX(e.start_at) AS last_event
     FROM attendance att
     JOIN events e ON e.id = att.event_id
     WHERE att.volunteer_id = $1 AND att.status = 'attended'`,
    [volunteerId]
  );

  const lastEvent = lastActivity[0]?.last_event;
  const daysSinceLast = lastEvent
    ? Math.floor((Date.now() - new Date(lastEvent).getTime()) / 86400000)
    : 999;
  const churnRisk = daysSinceLast <= 30 ? 'low' : daysSinceLast <= 60 ? 'medium' : 'high';

  // Monthly breakdown for seasonality
  const { rows: monthly } = await query(
    `SELECT
       to_char(e.start_at, 'YYYY-MM') AS month,
       COUNT(*)::int AS events_count,
       COALESCE(SUM(att.hours), 0)::numeric AS hours_total
     FROM attendance att
     JOIN events e ON e.id = att.event_id
     WHERE att.volunteer_id = $1 AND att.status = 'attended'
     GROUP BY month
     ORDER BY month ASC`,
    [volunteerId]
  );

  res.json({
    weekly,
    monthly,
    churn_risk: churnRisk,
    days_since_last_event: daysSinceLast === 999 ? null : daysSinceLast,
    last_event_date: lastEvent || null,
  });
});
