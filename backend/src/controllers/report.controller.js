import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getOrganizationForUser } from '../services/ownership.service.js';

export const getOrganizationReport = asyncHandler(async (req, res) => {
  let organizationId = req.query.organization_id;

  if (req.user.role === 'organization') {
    const organization = await getOrganizationForUser(req.user.id);
    if (!organization) {
      throw new ApiError(404, 'Organization profile not found');
    }
    organizationId = organization.id;
  }

  if (!organizationId) {
    throw new ApiError(400, 'organization_id is required');
  }

  const [summary, opportunityStats, eventStats, hours, taskStats] = await Promise.all([
    query(
      `SELECT
        COUNT(DISTINCT op.id)::int AS opportunities,
        COUNT(DISTINCT app.id)::int AS applications,
        COUNT(DISTINCT e.id)::int AS events,
        COUNT(DISTINCT att.volunteer_id)::int AS assigned_volunteers
       FROM organizations org
       LEFT JOIN opportunities op ON op.organization_id = org.id
       LEFT JOIN applications app ON app.opportunity_id = op.id
       LEFT JOIN events e ON e.organization_id = org.id
       LEFT JOIN attendance att ON att.event_id = e.id
       WHERE org.id = $1`,
      [organizationId]
    ),
    query(
      `SELECT app.status, COUNT(*)::int AS count
       FROM applications app
       JOIN opportunities op ON op.id = app.opportunity_id
       WHERE op.organization_id = $1
       GROUP BY app.status`,
      [organizationId]
    ),
    query(
      `SELECT status, COUNT(*)::int AS count
       FROM events
       WHERE organization_id = $1
       GROUP BY status`,
      [organizationId]
    ),
    query(
      `SELECT COALESCE(SUM(att.hours), 0)::numeric AS hours_completed
       FROM attendance att
       JOIN events e ON e.id = att.event_id
       WHERE e.organization_id = $1 AND att.status = 'attended'`,
      [organizationId]
    ),
    query(
      `SELECT
         COUNT(*) FILTER (WHERE att.status = 'attended')::int AS completed,
         COUNT(*) FILTER (WHERE att.status = 'assigned')::int AS remaining
       FROM attendance att
       JOIN events e ON e.id = att.event_id
       WHERE e.organization_id = $1`,
      [organizationId]
    ),
  ]);

  res.json({
    summary: summary.rows[0],
    application_statuses: opportunityStats.rows,
    event_statuses: eventStats.rows,
    hours: hours.rows[0],
    tasks: taskStats.rows[0] || { completed: 0, remaining: 0 },
  });
});

export const getPlatformReport = asyncHandler(async (_req, res) => {
  const [monthlyHours, monthlyApplications, topOrganizations] = await Promise.all([
    query(
      `SELECT date_trunc('month', e.start_at) AS month, COALESCE(SUM(att.hours), 0)::numeric AS hours
       FROM attendance att
       JOIN events e ON e.id = att.event_id
       WHERE att.status = 'attended'
       GROUP BY 1
       ORDER BY 1`
    ),
    query(
      `SELECT date_trunc('month', applied_at) AS month, COUNT(*)::int AS applications
       FROM applications
       GROUP BY 1
       ORDER BY 1`
    ),
    query(
      `SELECT org.name, COALESCE(SUM(att.hours), 0)::numeric AS hours
       FROM organizations org
       LEFT JOIN events e ON e.organization_id = org.id
       LEFT JOIN attendance att ON att.event_id = e.id AND att.status = 'attended'
       GROUP BY org.id
       ORDER BY hours DESC
       LIMIT 10`
    ),
  ]);

  res.json({
    monthly_hours: monthlyHours.rows,
    monthly_applications: monthlyApplications.rows,
    top_organizations: topOrganizations.rows,
  });
});

export const getVolunteerReport = asyncHandler(async (req, res) => {
  const volunteerResult = await query('SELECT * FROM volunteers WHERE user_id = $1', [req.user.id]);
  const volunteer = volunteerResult.rows[0];

  if (!volunteer) {
    throw new ApiError(404, 'Volunteer profile not found');
  }

  const [
    completedTasks,
    remainingTasks,
    totalHours,
    certificatesCount,
    recentActivity,
    hoursByMonth,
  ] = await Promise.all([
    query(
      `SELECT COUNT(*)::int AS count
       FROM attendance att
       JOIN events e ON e.id = att.event_id
       WHERE att.volunteer_id = $1 AND att.status = 'attended'`,
      [volunteer.id]
    ),
    query(
      `SELECT COUNT(*)::int AS count
       FROM attendance att
       JOIN events e ON e.id = att.event_id
       WHERE att.volunteer_id = $1 AND att.status IN ('assigned', 'no_show')`,
      [volunteer.id]
    ),
    query(
      `SELECT COALESCE(SUM(hours), 0)::numeric AS hours
       FROM attendance
       WHERE volunteer_id = $1 AND status = 'attended'`,
      [volunteer.id]
    ),
    query(`SELECT COUNT(*)::int AS count FROM certificates WHERE volunteer_id = $1`, [
      volunteer.id,
    ]),
    query(
      `SELECT att.*, e.title AS event_title, e.start_at, org.name AS organization_name
       FROM attendance att
       JOIN events e ON e.id = att.event_id
       JOIN organizations org ON org.id = e.organization_id
       WHERE att.volunteer_id = $1
       ORDER BY e.start_at DESC
       LIMIT 10`,
      [volunteer.id]
    ),
    query(
      `SELECT date_trunc('month', e.start_at) AS month, COALESCE(SUM(att.hours), 0)::numeric AS hours
       FROM attendance att
       JOIN events e ON e.id = att.event_id
       WHERE att.volunteer_id = $1 AND att.status = 'attended'
       GROUP BY 1
       ORDER BY 1`,
      [volunteer.id]
    ),
  ]);

  res.json({
    completed_tasks: completedTasks.rows[0].count,
    remaining_tasks: remainingTasks.rows[0].count,
    total_hours: totalHours.rows[0].hours,
    certificates_count: certificatesCount.rows[0].count,
    recent_activity: recentActivity.rows,
    hours_by_month: hoursByMonth.rows,
  });
});
