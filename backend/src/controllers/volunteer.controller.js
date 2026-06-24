import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import {
  findVolunteerById,
  findVolunteerByUserId,
  listVolunteers,
} from '../models/volunteer.model.js';

const updateableFields = [
  'phone',
  'location',
  'bio',
  'skills',
  'interests',
  'availability',
  'profile_picture_url',
  'volunteer_type',
  'institution',
  'field_of_study',
  'linkedin_url',
  'github_url',
];

const updateVolunteer = async (volunteerId, payload) => {
  const sets = [];
  const values = [];

  for (const field of updateableFields) {
    if (payload[field] !== undefined) {
      values.push(field === 'availability' ? JSON.stringify(payload[field]) : payload[field]);
      sets.push(`${field} = $${values.length}`);
    }
  }

  if (!sets.length) {
    return findVolunteerById(volunteerId);
  }

  values.push(volunteerId);
  const { rows } = await query(
    `UPDATE volunteers
     SET ${sets.join(', ')}
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  return rows[0];
};

export const getMyVolunteerProfile = asyncHandler(async (req, res) => {
  const profile = await findVolunteerByUserId(req.user.id);
  if (!profile) {
    throw new ApiError(404, 'Volunteer profile not found');
  }

  res.json(profile);
});

export const updateMyVolunteerProfile = asyncHandler(async (req, res) => {
  const profile = await findVolunteerByUserId(req.user.id);
  if (!profile) {
    throw new ApiError(404, 'Volunteer profile not found');
  }

  const updated = await updateVolunteer(profile.id, req.body);
  res.json(updated);
});

export const getVolunteer = asyncHandler(async (req, res) => {
  const volunteer = await findVolunteerById(req.params.id);
  if (!volunteer) {
    throw new ApiError(404, 'Volunteer not found');
  }

  res.json(volunteer);
});

export const listVolunteerProfiles = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { volunteers, total } = await listVolunteers({
    limit,
    offset,
    search: req.query.search,
    skill: req.query.skill,
  });

  res.json({
    data: volunteers,
    meta: getPaginationMeta(page, limit, total),
  });
});

export const getMyParticipationHistory = asyncHandler(async (req, res) => {
  const profile = await findVolunteerByUserId(req.user.id);
  if (!profile) {
    throw new ApiError(404, 'Volunteer profile not found');
  }

  const [applications, attendance, certificates] = await Promise.all([
    query(
      `SELECT app.*, op.title AS opportunity_title, op.category, org.name AS organization_name
       FROM applications app
       JOIN opportunities op ON op.id = app.opportunity_id
       JOIN organizations org ON org.id = op.organization_id
       WHERE app.volunteer_id = $1
       ORDER BY app.applied_at DESC`,
      [profile.id]
    ),
    query(
      `SELECT att.*, e.title AS event_title, e.start_at, e.end_at, org.name AS organization_name
       FROM attendance att
       JOIN events e ON e.id = att.event_id
       JOIN organizations org ON org.id = e.organization_id
       WHERE att.volunteer_id = $1
       ORDER BY e.start_at DESC`,
      [profile.id]
    ),
    query(
      `SELECT *
       FROM certificates
       WHERE volunteer_id = $1
       ORDER BY issued_at DESC`,
      [profile.id]
    ),
  ]);

  res.json({
    applications: applications.rows,
    attendance: attendance.rows,
    certificates: certificates.rows,
  });
});

export const getMyHours = asyncHandler(async (req, res) => {
  const profile = await findVolunteerByUserId(req.user.id);
  if (!profile) {
    throw new ApiError(404, 'Volunteer profile not found');
  }

  const { rows } = await query(
    `SELECT
      v.total_hours,
      COUNT(att.id) FILTER (WHERE att.status = 'attended')::int AS completed_events,
      COUNT(c.id)::int AS certificates_count
     FROM volunteers v
     LEFT JOIN attendance att ON att.volunteer_id = v.id
     LEFT JOIN certificates c ON c.volunteer_id = v.id
     WHERE v.id = $1
     GROUP BY v.id`,
    [profile.id]
  );

  res.json(rows[0]);
});

export const getVolunteerHeatmap = asyncHandler(async (req, res) => {
  const profile = await findVolunteerByUserId(req.user.id);
  if (!profile) {
    throw new ApiError(404, 'Volunteer profile not found');
  }
  const volunteerId = profile.id;

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
    ? Math.max(0, Math.floor((Date.now() - new Date(lastEvent).getTime()) / 86400000))
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
