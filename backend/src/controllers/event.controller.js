import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import { findVolunteerByUserId } from '../models/volunteer.model.js';
import { getEventWithOrganization, getOrganizationForUser } from '../services/ownership.service.js';

const updateableFields = [
  'opportunity_id',
  'title',
  'description',
  'location',
  'start_at',
  'end_at',
  'capacity',
  'status',
];

const canManageEvent = async (user, eventId) => {
  if (user.role === 'admin') {
    return true;
  }

  const event = await getEventWithOrganization(eventId);
  return Boolean(event && event.organization_user_id === user.id);
};

export const listEvents = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const values = [];
  const conditions = [];

  if (req.query.status) {
    values.push(req.query.status);
    conditions.push(`e.status = $${values.length}`);
  }

  if (req.query.from) {
    values.push(req.query.from);
    conditions.push(`e.start_at >= $${values.length}`);
  }

  if (req.query.to) {
    values.push(req.query.to);
    conditions.push(`e.end_at <= $${values.length}`);
  }

  if (req.user.role === 'organization') {
    values.push(req.user.id);
    conditions.push(`org.user_id = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [{ rows }, countResult] = await Promise.all([
    query(
      `SELECT e.*, org.name AS organization_name, op.title AS opportunity_title,
        COUNT(att.id)::int AS assigned_count,
        COUNT(att.id) FILTER (WHERE att.status = 'attended')::int AS attended_count
       FROM events e
       JOIN organizations org ON org.id = e.organization_id
       LEFT JOIN opportunities op ON op.id = e.opportunity_id
       LEFT JOIN attendance att ON att.event_id = e.id
       ${where}
       GROUP BY e.id, org.name, op.title
       ORDER BY e.start_at ASC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    ),
    query(
      `SELECT COUNT(*)::int AS total
       FROM events e
       JOIN organizations org ON org.id = e.organization_id
       ${where}`,
      values
    ),
  ]);

  res.json({
    data: rows,
    meta: getPaginationMeta(page, limit, countResult.rows[0].total),
  });
});

export const getAssignedEvents = asyncHandler(async (req, res) => {
  const volunteer = await findVolunteerByUserId(req.user.id);
  if (!volunteer) {
    throw new ApiError(404, 'Volunteer profile not found');
  }

  const { rows } = await query(
    `SELECT e.*, v.id AS volunteer_id,
            att.id AS attendance_id, att.status AS attendance_status, att.hours,
            att.check_in_at, att.check_out_at, att.notes,
            org.name AS organization_name
     FROM attendance att
     JOIN events e ON e.id = att.event_id
     JOIN volunteers v ON v.id = att.volunteer_id
     JOIN organizations org ON org.id = e.organization_id
     WHERE att.volunteer_id = $1
     ORDER BY e.start_at ASC`,
    [volunteer.id]
  );

  res.json(rows);
});

export const getEvent = asyncHandler(async (req, res) => {
  const event = await getEventWithOrganization(req.params.id);
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  res.json(event);
});

export const createEvent = asyncHandler(async (req, res) => {
  let organizationId = req.body.organization_id;

  if (req.user.role === 'organization') {
    const organization = await getOrganizationForUser(req.user.id);
    if (!organization) {
      throw new ApiError(404, 'Organization profile not found');
    }
    organizationId = organization.id;
  }

  if (!organizationId) {
    throw new ApiError(400, 'organization_id is required for admin-created events');
  }

  const { rows } = await query(
    `INSERT INTO events (
       opportunity_id, organization_id, created_by, title, description, location, start_at, end_at, capacity, status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      req.body.opportunity_id || null,
      organizationId,
      req.user.id,
      req.body.title,
      req.body.description || null,
      req.body.location || null,
      req.body.start_at,
      req.body.end_at,
      req.body.capacity || null,
      req.body.status || 'scheduled',
    ]
  );

  res.status(201).json(rows[0]);
});

export const updateEvent = asyncHandler(async (req, res) => {
  if (!(await canManageEvent(req.user, req.params.id))) {
    throw new ApiError(403, 'You cannot manage this event');
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
    return res.json(await getEventWithOrganization(req.params.id));
  }

  values.push(req.params.id);
  const { rows } = await query(
    `UPDATE events
     SET ${sets.join(', ')}
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  if (!rows[0]) {
    throw new ApiError(404, 'Event not found');
  }

  res.json(rows[0]);
});

export const deleteEvent = asyncHandler(async (req, res) => {
  if (!(await canManageEvent(req.user, req.params.id))) {
    throw new ApiError(403, 'You cannot manage this event');
  }

  const { rows } = await query(
    `UPDATE events
     SET status = 'cancelled'
     WHERE id = $1
     RETURNING *`,
    [req.params.id]
  );

  if (!rows[0]) {
    throw new ApiError(404, 'Event not found');
  }

  res.json(rows[0]);
});
