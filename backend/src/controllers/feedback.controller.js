import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Submit feedback (volunteer rating event, or org/admin rating volunteer)
export const submitFeedback = asyncHandler(async (req, res) => {
  const { attendance_id, rating, tags, comment, feedback_type } = req.body;
  if (!['event', 'volunteer'].includes(feedback_type)) {
    throw new ApiError(400, 'feedback_type must be event or volunteer');
  }
  if (rating < 1 || rating > 5) throw new ApiError(400, 'rating must be 1-5');

  // Verify attendance record exists and requester is authorized
  const attResult = await query(
    `SELECT att.*, v.user_id AS volunteer_user_id, e.organization_id,
            org.user_id AS org_user_id
     FROM attendance att
     JOIN volunteers v ON v.id = att.volunteer_id
     JOIN events e ON e.id = att.event_id
     JOIN organizations org ON org.id = e.organization_id
     WHERE att.id = $1`,
    [attendance_id]
  );
  const att = attResult.rows[0];
  if (!att) throw new ApiError(404, 'Attendance record not found');

  // Volunteers can only rate the event, orgs/admins can only rate the volunteer
  if (feedback_type === 'event' && att.volunteer_user_id !== req.user.id) {
    throw new ApiError(403, 'You can only rate events you attended');
  }
  if (feedback_type === 'volunteer' && req.user.role === 'volunteer') {
    throw new ApiError(403, 'Only organizations and admins can rate volunteers');
  }

  // Prevent duplicate feedback
  const existing = await query(
    `SELECT id FROM feedback WHERE attendance_id = $1 AND reviewer_user_id = $2 AND feedback_type = $3`,
    [attendance_id, req.user.id, feedback_type]
  );
  if (existing.rows[0]) throw new ApiError(409, 'You already submitted this feedback');

  const { rows } = await query(
    `INSERT INTO feedback (attendance_id, reviewer_user_id, rating, tags, comment, feedback_type)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [attendance_id, req.user.id, rating, tags || [], comment || null, feedback_type]
  );
  res.status(201).json(rows[0]);
});

// Get aggregate feedback for a volunteer
export const getVolunteerFeedbackStats = asyncHandler(async (req, res) => {
  const volunteerId = req.params.volunteerId || null;
  // If volunteer role, only their own
  const volunteerFilter = volunteerId || req.user.id;

  const { rows } = await query(
    `SELECT
       ROUND(AVG(f.rating)::numeric, 1) AS avg_rating,
       COUNT(f.id)::int AS total_reviews,
       ARRAY_AGG(DISTINCT unnest_tag) FILTER (WHERE unnest_tag IS NOT NULL) AS common_tags
     FROM feedback f
     JOIN attendance att ON att.id = f.attendance_id
     JOIN volunteers v ON v.id = att.volunteer_id
     JOIN users u ON u.id = v.user_id
     CROSS JOIN LATERAL unnest(f.tags) AS unnest_tag
     WHERE f.feedback_type = 'volunteer'
       AND (u.id = $1 OR v.user_id = $1)`,
    [volunteerFilter]
  );
  res.json(rows[0] || { avg_rating: null, total_reviews: 0, common_tags: [] });
});

// Get aggregate feedback for an event (available to org/admin)
export const getEventFeedbackStats = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { rows } = await query(
    `SELECT
       ROUND(AVG(f.rating)::numeric, 1) AS avg_rating,
       COUNT(f.id)::int AS total_reviews,
       JSONB_OBJECT_AGG(rating_val, cnt) AS rating_distribution
     FROM (
       SELECT f.rating,
              gs.rating_val,
              COUNT(f.id) FILTER (WHERE f.rating = gs.rating_val)::int AS cnt
       FROM feedback f
       JOIN attendance att ON att.id = f.attendance_id
       CROSS JOIN generate_series(1,5) AS gs(rating_val)
       WHERE att.event_id = $1 AND f.feedback_type = 'event'
       GROUP BY f.rating, gs.rating_val
     ) sub`,
    [eventId]
  );
  res.json(rows[0] || { avg_rating: null, total_reviews: 0, rating_distribution: {} });
});

// List pending feedback tasks for current user
export const getPendingFeedback = asyncHandler(async (req, res) => {
  let sql, params;
  if (req.user.role === 'volunteer') {
    // Volunteer: all attended events where they haven't rated
    sql = `
      SELECT att.id AS attendance_id, e.title AS event_title, e.end_at,
             org.name AS organization_name, 'event' AS feedback_type
      FROM attendance att
      JOIN volunteers v ON v.id = att.volunteer_id
      JOIN events e ON e.id = att.event_id
      JOIN organizations org ON org.id = e.organization_id
      WHERE v.user_id = $1
        AND att.status = 'attended'
        AND NOT EXISTS (
          SELECT 1 FROM feedback f
          WHERE f.attendance_id = att.id
            AND f.reviewer_user_id = $1
            AND f.feedback_type = 'event'
        )
      ORDER BY e.end_at DESC
      LIMIT 20`;
    params = [req.user.id];
  } else {
    // Org/Admin: all attended events where they haven't rated the volunteer
    sql = `
      SELECT att.id AS attendance_id, e.title AS event_title, e.end_at,
             u.name AS volunteer_name, u.email AS volunteer_email,
             'volunteer' AS feedback_type
      FROM attendance att
      JOIN events e ON e.id = att.event_id
      JOIN organizations org ON org.id = e.organization_id
      JOIN volunteers v ON v.id = att.volunteer_id
      JOIN users u ON u.id = v.user_id
      WHERE org.user_id = $1
        AND att.status = 'attended'
        AND NOT EXISTS (
          SELECT 1 FROM feedback f
          WHERE f.attendance_id = att.id
            AND f.reviewer_user_id = $1
            AND f.feedback_type = 'volunteer'
        )
      ORDER BY e.end_at DESC
      LIMIT 20`;
    params = [req.user.id];
  }
  const { rows } = await query(sql, params);
  res.json(rows);
});
