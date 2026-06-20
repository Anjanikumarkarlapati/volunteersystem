import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import { findVolunteerByUserId } from '../models/volunteer.model.js';
import { notifyUser } from '../services/notification.service.js';

const getApplicationForReview = async applicationId => {
  const { rows } = await query(
    `SELECT app.*, op.title AS opportunity_title, org.user_id AS organization_user_id,
      v.user_id AS volunteer_user_id, vu.email AS volunteer_email, vu.name AS volunteer_name
     FROM applications app
     JOIN opportunities op ON op.id = app.opportunity_id
     JOIN organizations org ON org.id = op.organization_id
     JOIN volunteers v ON v.id = app.volunteer_id
     JOIN users vu ON vu.id = v.user_id
     WHERE app.id = $1`,
    [applicationId]
  );

  return rows[0];
};

export const applyForOpportunity = asyncHandler(async (req, res) => {
  const volunteer = await findVolunteerByUserId(req.user.id);
  if (!volunteer) {
    throw new ApiError(404, 'Volunteer profile not found');
  }

  const opportunityResult = await query(
    `SELECT op.*, org.user_id AS organization_user_id, org.name AS organization_name, ou.email AS organization_email
     FROM opportunities op
     JOIN organizations org ON org.id = op.organization_id
     JOIN users ou ON ou.id = org.user_id
     WHERE op.id = $1`,
    [req.params.opportunityId]
  );
  const opportunity = opportunityResult.rows[0];

  if (!opportunity || opportunity.status !== 'open') {
    throw new ApiError(400, 'Opportunity is not open for applications');
  }

  const { rows } = await query(
    `INSERT INTO applications (opportunity_id, volunteer_id, message)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [req.params.opportunityId, volunteer.id, req.body.message || null]
  ).catch(error => {
    if (error.code === '23505') {
      throw new ApiError(409, 'You already applied for this opportunity');
    }
    throw error;
  });

  await notifyUser({
    userId: opportunity.organization_user_id,
    email: opportunity.organization_email,
    title: 'New volunteer application',
    message: `${req.user.name} applied to ${opportunity.title}.`,
    type: 'application',
    metadata: { applicationId: rows[0].id, opportunityId: opportunity.id },
  });

  res.status(201).json(rows[0]);
});

export const listMyApplications = asyncHandler(async (req, res) => {
  const volunteer = await findVolunteerByUserId(req.user.id);
  if (!volunteer) {
    throw new ApiError(404, 'Volunteer profile not found');
  }

  const { rows } = await query(
    `SELECT app.*, op.title AS opportunity_title, op.category, op.start_date, org.name AS organization_name
     FROM applications app
     JOIN opportunities op ON op.id = app.opportunity_id
     JOIN organizations org ON org.id = op.organization_id
     WHERE app.volunteer_id = $1
     ORDER BY app.applied_at DESC`,
    [volunteer.id]
  );

  res.json(rows);
});

export const listApplications = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const values = [];
  const conditions = [];

  if (req.user.role === 'organization') {
    values.push(req.user.id);
    conditions.push(`org.user_id = $${values.length}`);
  }

  if (req.query.status) {
    values.push(req.query.status);
    conditions.push(`app.status = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [{ rows }, countResult] = await Promise.all([
    query(
      `SELECT app.*, op.title AS opportunity_title, org.name AS organization_name,
        vu.name AS volunteer_name, vu.email AS volunteer_email
       FROM applications app
       JOIN opportunities op ON op.id = app.opportunity_id
       JOIN organizations org ON org.id = op.organization_id
       JOIN volunteers v ON v.id = app.volunteer_id
       JOIN users vu ON vu.id = v.user_id
       ${where}
       ORDER BY app.applied_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    ),
    query(
      `SELECT COUNT(*)::int AS total
       FROM applications app
       JOIN opportunities op ON op.id = app.opportunity_id
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

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const application = await getApplicationForReview(req.params.id);
  if (!application) {
    throw new ApiError(404, 'Application not found');
  }

  if (req.user.role !== 'admin' && application.organization_user_id !== req.user.id) {
    throw new ApiError(403, 'You cannot review this application');
  }

  const { rows } = await query(
    `UPDATE applications
     SET status = $2, review_notes = $3, reviewed_by = $4, reviewed_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [req.params.id, req.body.status, req.body.review_notes || null, req.user.id]
  );

  const updatedApp = rows[0];

  if (req.body.status === 'approved' && application.status !== 'approved') {
    // Get organization ID from opportunity
    const orgResult = await query(`SELECT organization_id FROM opportunities WHERE id = $1`, [
      application.opportunity_id,
    ]);
    const organizationId = orgResult.rows[0]?.organization_id;

    if (organizationId) {
      // Create 5 daily events
      for (let i = 0; i < 5; i++) {
        const eventResult = await query(
          `INSERT INTO events (
             opportunity_id, organization_id, created_by, title, description, start_at, end_at, capacity, status
           )
           VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '${i} days', NOW() + INTERVAL '${i} days' + INTERVAL '4 hours', 1, 'scheduled')
           RETURNING *`,
          [
            application.opportunity_id,
            organizationId,
            req.user.id,
            `Day ${i + 1} Task: ${application.opportunity_title}`,
            `Daily task (4 hours) for ${application.volunteer_name}.`,
          ]
        );
        const newEvent = eventResult.rows[0];

        // Assign the volunteer
        await query(
          `INSERT INTO attendance (event_id, volunteer_id, status, notes)
           VALUES ($1, $2, 'assigned', '5 days')`,
          [newEvent.id, application.volunteer_id]
        );
      }
    }
  }

  await notifyUser({
    userId: application.volunteer_user_id,
    email: application.volunteer_email,
    title: `Application ${req.body.status}`,
    message: `Your application for ${application.opportunity_title} was ${req.body.status}.`,
    type: 'application',
    metadata: { applicationId: application.id, status: req.body.status },
  });

  res.json(updatedApp);
});
