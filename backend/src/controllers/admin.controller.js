import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import { listUsers, updateUserStatus } from '../models/user.model.js';

export const getDashboardOverview = asyncHandler(async (_req, res) => {
  const { rows } = await query(
    `SELECT
      (SELECT COUNT(*)::int FROM users WHERE role = 'volunteer') AS total_volunteers,
      (SELECT COUNT(*)::int FROM organizations) AS total_organizations,
      (SELECT COUNT(*)::int FROM opportunities WHERE status = 'open') AS active_opportunities,
      (SELECT COUNT(*)::int FROM events WHERE status = 'scheduled') AS upcoming_events,
      (SELECT COALESCE(SUM(hours), 0)::numeric FROM attendance WHERE status = 'attended') AS volunteer_hours_completed,
      (SELECT COUNT(*)::int FROM applications WHERE status = 'pending') AS pending_applications,
      (SELECT COUNT(*)::int FROM certificates) AS certificates_issued`
  );

  const applicationStats = await query(
    `SELECT status, COUNT(*)::int AS count FROM applications GROUP BY status ORDER BY status`
  );

  const categoryStats = await query(
    `SELECT category, COUNT(*)::int AS count FROM opportunities GROUP BY category ORDER BY count DESC`
  );

  res.json({
    ...rows[0],
    application_stats: applicationStats.rows,
    opportunity_categories: categoryStats.rows,
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { users, total } = await listUsers({
    limit,
    offset,
    role: req.query.role,
    status: req.query.status,
    search: req.query.search,
  });
  res.json({ data: users, meta: getPaginationMeta(page, limit, total) });
});

export const changeUserStatus = asyncHandler(async (req, res) => {
  const user = await updateUserStatus(req.params.id, req.body.status);
  if (!user) throw new ApiError(404, 'User not found');
  res.json(user);
});

export const getPlatformMonitoring = asyncHandler(async (_req, res) => {
  const [logs, errorsByHour, registrations] = await Promise.all([
    query(
      `SELECT al.*, u.email AS actor_email FROM activity_logs al
       LEFT JOIN users u ON u.id = al.actor_user_id
       ORDER BY al.created_at DESC LIMIT 50`
    ),
    query(
      `SELECT date_trunc('hour', created_at) AS hour, COUNT(*)::int AS count
       FROM activity_logs WHERE created_at >= NOW() - INTERVAL '24 hours' GROUP BY 1 ORDER BY 1`
    ),
    query(
      `SELECT role, COUNT(*)::int AS count FROM users
       WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY role`
    ),
  ]);
  res.json({
    recent_activity: logs.rows,
    activity_by_hour: errorsByHour.rows,
    registrations_30_days: registrations.rows,
  });
});

// Admin – full volunteer profiles with stats
export const getAllVolunteerProfiles = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const search = req.query.search || '';
  const values = [];
  const conditions = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(u.name ILIKE $${values.length} OR u.email ILIKE $${values.length})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [profilesResult, countResult] = await Promise.all([
    query(
      `SELECT
         v.id AS volunteer_id, u.id AS user_id, u.name, u.email,
         u.status AS account_status, u.created_at AS joined_at,
         v.phone, v.location, v.bio, v.skills, v.interests, v.total_hours,
         v.profile_picture_url, v.volunteer_type, v.institution, v.field_of_study,
         v.linkedin_url, v.github_url,
         (SELECT COUNT(*)::int FROM applications WHERE volunteer_id = v.id) AS total_applications,
         (SELECT COUNT(*)::int FROM applications WHERE volunteer_id = v.id AND status = 'approved') AS approved_applications,
         (SELECT COUNT(*)::int FROM attendance WHERE volunteer_id = v.id AND status = 'attended') AS completed_events,
         (SELECT COUNT(*)::int FROM certificates WHERE volunteer_id = v.id) AS certificates_count
       FROM volunteers v
       JOIN users u ON u.id = v.user_id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    ),
    query(
      `SELECT COUNT(*)::int AS total FROM volunteers v JOIN users u ON u.id = v.user_id ${where}`,
      values
    ),
  ]);

  res.json({
    data: profilesResult.rows,
    meta: getPaginationMeta(page, limit, countResult.rows[0].total),
  });
});

// Admin – all attendance records across all events
export const getAllAttendance = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const statusFilter = req.query.status;
  const conditions = [];
  const values = [];

  if (statusFilter) {
    values.push(statusFilter);
    conditions.push(`att.status = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [attendanceResult, countResult] = await Promise.all([
    query(
      `SELECT
         att.id, att.status, att.check_in_at, att.check_out_at, att.hours, att.notes,
         att.created_at,
         v.id AS volunteer_id,
         u.name AS volunteer_name, u.email AS volunteer_email,
         e.title AS event_title, e.start_at AS event_start, e.end_at AS event_end,
         org.name AS organization_name
       FROM attendance att
       JOIN volunteers v ON v.id = att.volunteer_id
       JOIN users u ON u.id = v.user_id
       JOIN events e ON e.id = att.event_id
       JOIN organizations org ON org.id = e.organization_id
       ${where}
       ORDER BY e.start_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    ),
    query(
      `SELECT COUNT(*)::int AS total FROM attendance att JOIN events e ON e.id = att.event_id ${where}`,
      values
    ),
  ]);

  res.json({
    data: attendanceResult.rows,
    meta: getPaginationMeta(page, limit, countResult.rows[0].total),
  });
});

// Admin – get a specific volunteer's full task history
export const getVolunteerCompletedTasks = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [volunteerInfo, attendanceHistory, applicationHistory, certHistory] = await Promise.all([
    query(
      `SELECT v.*, u.name, u.email, u.status AS account_status, u.created_at AS joined_at
       FROM volunteers v JOIN users u ON u.id = v.user_id WHERE v.id = $1`,
      [id]
    ),
    query(
      `SELECT att.*, e.title AS event_title, e.start_at, e.end_at, org.name AS organization_name
       FROM attendance att
       JOIN events e ON e.id = att.event_id
       JOIN organizations org ON org.id = e.organization_id
       WHERE att.volunteer_id = $1 ORDER BY e.start_at DESC`,
      [id]
    ),
    query(
      `SELECT app.*, op.title AS opportunity_title, op.category, org.name AS organization_name
       FROM applications app
       JOIN opportunities op ON op.id = app.opportunity_id
       JOIN organizations org ON org.id = op.organization_id
       WHERE app.volunteer_id = $1 ORDER BY app.applied_at DESC`,
      [id]
    ),
    query(
      `SELECT c.*, e.title AS event_title
       FROM certificates c LEFT JOIN events e ON e.id = c.event_id
       WHERE c.volunteer_id = $1 ORDER BY c.issued_at DESC`,
      [id]
    ),
  ]);

  if (!volunteerInfo.rows[0]) throw new ApiError(404, 'Volunteer not found');

  res.json({
    volunteer: volunteerInfo.rows[0],
    attendance: attendanceHistory.rows,
    applications: applicationHistory.rows,
    certificates: certHistory.rows,
  });
});

export const searchEvents = asyncHandler(async (req, res) => {
  const { location, start_date, end_date } = req.query;
  let where = 'WHERE 1=1';
  const values = [];

  if (location) {
    values.push(`%${location}%`);
    where += ` AND e.location ILIKE $${values.length}`;
  }
  if (start_date) {
    values.push(start_date);
    where += ` AND e.start_at >= $${values.length}::timestamp`;
  }
  if (end_date) {
    values.push(end_date);
    where += ` AND e.end_at <= $${values.length}::timestamp`;
  }

  const { rows } = await query(
    `SELECT e.*, org.name AS organization_name 
     FROM events e 
     JOIN organizations org ON org.id = e.organization_id 
     ${where} 
     ORDER BY e.start_at ASC LIMIT 50`,
    values
  );

  res.json({ data: rows });
});

export const assignTask = asyncHandler(async (req, res) => {
  const { volunteer_id, event_id } = req.body;
  if (!volunteer_id || !event_id) {
    throw new ApiError(400, 'volunteer_id and event_id are required');
  }

  // verify event exists
  const eventCheck = await query('SELECT id FROM events WHERE id = $1', [event_id]);
  if (!eventCheck.rows[0]) throw new ApiError(404, 'Event not found');

  // verify volunteer exists
  const volCheck = await query('SELECT id FROM volunteers WHERE id = $1', [volunteer_id]);
  if (!volCheck.rows[0]) throw new ApiError(404, 'Volunteer not found');

  // Insert assignment
  try {
    const { rows } = await query(
      `INSERT INTO attendance (event_id, volunteer_id, status)
       VALUES ($1, $2, 'assigned')
       RETURNING *`,
      [event_id, volunteer_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      // unique violation
      throw new ApiError(409, 'Volunteer is already assigned to this event');
    }
    throw err;
  }
});

export const getPendingOpportunities = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT op.*, org.name AS organization_name
     FROM opportunities op
     JOIN organizations org ON org.id = op.organization_id
     WHERE op.status = 'pending'
     ORDER BY op.created_at ASC`
  );
  res.json({ data: rows });
});

export const changeOpportunityStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const { rows } = await query(
    `UPDATE opportunities SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );

  if (!rows[0]) throw new ApiError(404, 'Opportunity not found');

  // Notify organizer
  if (status === 'open' || status === 'cancelled') {
    const opp = rows[0];
    const orgRes = await query(`SELECT user_id FROM organizations WHERE id = $1`, [
      opp.organization_id,
    ]);
    if (orgRes.rows[0]) {
      const msg =
        status === 'open'
          ? `Your opportunity "${opp.title}" has been approved and is now live!`
          : `Your opportunity "${opp.title}" has been rejected.`;
      await query(
        `INSERT INTO notifications (user_id, title, message, type, metadata) VALUES ($1, $2, $3, $4, $5)`,
        [
          orgRes.rows[0].user_id,
          'Opportunity Status Updated',
          msg,
          status === 'open' ? 'success' : 'error',
          JSON.stringify({ opportunity_id: opp.id }),
        ]
      );
    }
  }

  res.json(rows[0]);
});
