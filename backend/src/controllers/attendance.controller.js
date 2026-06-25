import { withTransaction, query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getEventWithOrganization } from '../services/ownership.service.js';
import { notifyUser } from '../services/notification.service.js';
import {
  generateCertificateNumber,
  generateCertificatePdf,
} from '../services/certificate.service.js';

const ensureCanManageEvent = async (user, eventId) => {
  const event = await getEventWithOrganization(eventId);
  if (!event) throw new ApiError(404, 'Event not found');
  if (user.role !== 'admin' && event.organization_user_id !== user.id) {
    throw new ApiError(403, 'You cannot manage attendance for this event');
  }
  return event;
};

export const listEventAttendance = asyncHandler(async (req, res) => {
  await ensureCanManageEvent(req.user, req.params.eventId);
  const { rows } = await query(
    `SELECT att.*, v.id AS volunteer_id, u.name AS volunteer_name, u.email AS volunteer_email,
       v.skills, v.location, e.start_at AS event_start, e.end_at AS event_end,
       (
         SELECT COUNT(*)::int 
         FROM attendance a2 
         JOIN events e2 ON e2.id = a2.event_id 
         WHERE a2.volunteer_id = att.volunteer_id 
           AND e2.opportunity_id = e.opportunity_id 
           AND a2.notes LIKE '%5 days%' 
           AND a2.verification_status = 'verified'
       ) AS completed_days
     FROM attendance att
     JOIN volunteers v ON v.id = att.volunteer_id
     JOIN events e ON e.id = att.event_id
     JOIN users u ON u.id = v.user_id
     WHERE att.event_id = $1
     ORDER BY u.name ASC`,
    [req.params.eventId]
  );
  res.json(rows);
});

export const assignVolunteers = asyncHandler(async (req, res) => {
  const event = await ensureCanManageEvent(req.user, req.params.eventId);
  const volunteerIds = req.body.volunteerIds || [req.body.volunteerId].filter(Boolean);

  if (!volunteerIds.length) throw new ApiError(400, 'At least one volunteerId is required');

  const assignments = await withTransaction(async client => {
    const created = [];
    for (const volunteerId of volunteerIds) {
      const { rows } = await client.query(
        `INSERT INTO attendance (event_id, volunteer_id, status, notes)
         VALUES ($1, $2, 'assigned', $3)
         ON CONFLICT (event_id, volunteer_id)
         DO UPDATE SET status = 'assigned', notes = EXCLUDED.notes
         RETURNING *`,
        [req.params.eventId, volunteerId, req.body.notes || null]
      );
      created.push(rows[0]);
    }
    return created;
  });

  const volunteerUsers = await query(
    `SELECT v.id AS volunteer_id, u.id AS user_id, u.email, u.name
     FROM volunteers v JOIN users u ON u.id = v.user_id
     WHERE v.id = ANY($1)`,
    [volunteerIds]
  );

  await Promise.all(
    volunteerUsers.rows.map(volunteer =>
      notifyUser({
        userId: volunteer.user_id,
        email: volunteer.email,
        title: '📋 Task Assigned',
        message: `You have been assigned to the event "${event.title}". Check your events page to see your schedule.`,
        type: 'event',
        metadata: { eventId: event.id },
      })
    )
  );

  res.status(201).json(assignments);
});

// Volunteer self check-in
export const selfCheckIn = asyncHandler(async (req, res) => {
  const { attendanceId } = req.params;

  // Find the attendance record and verify it belongs to this volunteer
  const volunteerResult = await query(`SELECT v.id FROM volunteers v WHERE v.user_id = $1`, [
    req.user.id,
  ]);
  if (!volunteerResult.rows[0]) throw new ApiError(404, 'Volunteer profile not found');

  const volunteerId = volunteerResult.rows[0].id;

  const attendanceResult = await query(
    `SELECT att.*, e.title AS event_title
     FROM attendance att
     JOIN events e ON e.id = att.event_id
     WHERE att.id = $1 AND att.volunteer_id = $2`,
    [attendanceId, volunteerId]
  );

  const att = attendanceResult.rows[0];
  if (!att) throw new ApiError(404, 'Attendance record not found or not yours');
  if (att.status === 'attended') throw new ApiError(400, 'You have already checked in');
  if (att.status === 'cancelled') throw new ApiError(400, 'This assignment has been cancelled');

  const now = new Date().toISOString();
  const { rows } = await query(
    `UPDATE attendance
     SET status = 'attended', check_in_at = COALESCE(check_in_at, $2), updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [attendanceId, now]
  );

  res.json({ ...rows[0], message: 'Check-in successful! You are marked as Present.' });
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const attendanceResult = await query(
    `SELECT att.*, e.organization_id, e.title AS event_title, e.opportunity_id,
            e.start_at AS event_start, e.end_at AS event_end,
            org.user_id AS organization_user_id,
            u.id AS volunteer_user_id, u.email AS volunteer_email, u.name AS volunteer_name
     FROM attendance att
     JOIN events e ON e.id = att.event_id
     JOIN organizations org ON org.id = e.organization_id
     JOIN volunteers v ON v.id = att.volunteer_id
     JOIN users u ON u.id = v.user_id
     WHERE att.id = $1`,
    [req.params.id]
  );

  const attendance = attendanceResult.rows[0];
  if (!attendance) throw new ApiError(404, 'Attendance record not found');

  if (req.user.role !== 'admin' && attendance.organization_user_id !== req.user.id) {
    throw new ApiError(403, 'You cannot update this attendance record');
  }

  const isCompleting = req.body.status === 'attended';
  const checkInAt =
    req.body.check_in_at ??
    attendance.check_in_at ??
    (isCompleting ? attendance.event_start : null);
  const checkOutAt =
    req.body.check_out_at ??
    attendance.check_out_at ??
    (isCompleting ? attendance.event_end : null);
  let hours = req.body.hours;

  if (hours === undefined && checkInAt && checkOutAt) {
    hours = Math.max(
      (new Date(checkOutAt).getTime() - new Date(checkInAt).getTime()) / 3600000,
      0
    ).toFixed(2);
  }

  // Auto-set 4 hours for individual 5-day daily tasks if not specified
  if (!hours && attendance.notes && attendance.notes.includes('5 days')) {
    hours = 4;
  }

  const updated = await withTransaction(async client => {
    const { rows } = await client.query(
      `UPDATE attendance
       SET status = COALESCE($2::varchar, status),
         check_in_at = COALESCE($3::timestamptz, check_in_at),
         check_out_at = COALESCE($4::timestamptz, check_out_at),
         hours = COALESCE($5::numeric, hours),
         notes = COALESCE($6::text, notes)
       WHERE id = $1
       RETURNING *`,
      [
        req.params.id,
        req.body.status || null,
        req.body.check_in_at || (isCompleting && !attendance.check_in_at ? checkInAt : null),
        req.body.check_out_at || (isCompleting && !attendance.check_out_at ? checkOutAt : null),
        hours ?? null,
        req.body.notes || null,
      ]
    );

    await client.query(
      `UPDATE volunteers
       SET total_hours = COALESCE((
         SELECT SUM(hours)
         FROM attendance
         WHERE volunteer_id = $1
           AND status = 'attended'
       ), 0)
       WHERE id = $1`,
      [attendance.volunteer_id]
    );

    return rows[0];
  });

  // Auto-notify volunteer when marked as attended (task completed)
  if (req.body.status === 'attended' && attendance.status !== 'attended') {
    let shouldGenerateCertificate = false;
    let totalHours = parseFloat(updated.hours || 0);

    if (attendance.notes?.includes('5 days')) {
      // Check if all 5 are completed
      const { rows: completedRows } = await query(
        `SELECT SUM(hours) as total_hours, count(*) as count FROM attendance att
         JOIN events e ON e.id = att.event_id
         WHERE att.volunteer_id = $1 AND e.opportunity_id = $2 AND att.notes LIKE '%5 days%' AND att.status = 'attended'`,
        [attendance.volunteer_id, attendance.opportunity_id]
      );
      if (completedRows[0].count >= 5) {
        shouldGenerateCertificate = true;
        totalHours = parseFloat(completedRows[0].total_hours || 0);
      }
    } else {
      shouldGenerateCertificate = true;
    }

    if (shouldGenerateCertificate) {
      // 1. Generate certificate
      const certificateNumber = generateCertificateNumber();
      const issuedAt = new Date();

      // Fetch organization name
      const orgResult = await query(`SELECT name FROM organizations WHERE id = $1`, [
        attendance.organization_id,
      ]);
      const organizationName = orgResult.rows[0]?.name || 'Volunteer Hub';

      const { fileUrl } = await generateCertificatePdf({
        certificateNumber,
        volunteerName: attendance.volunteer_name,
        organizationName,
        title: 'Certificate of Volunteer Service',
        hours: totalHours,
        issuedAt,
        eventTitle: attendance.event_title,
      });

      // Insert certificate record
      const certResult = await query(
        `INSERT INTO certificates (
           volunteer_id, event_id, certificate_number, title, hours, issued_by, issued_at, file_url
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          attendance.volunteer_id,
          attendance.event_id,
          certificateNumber,
          'Certificate of Volunteer Service',
          totalHours,
          req.user.id,
          issuedAt,
          fileUrl,
        ]
      );

      await notifyUser({
        userId: attendance.volunteer_user_id,
        email: attendance.volunteer_email,
        title: '✅ Task Completed & Certificate Ready!',
        message: `Congratulations ${attendance.volunteer_name}! Your attendance has been confirmed. You earned ${totalHours} hours of volunteer service and your certificate is ready to download!`,
        type: 'completion',
        metadata: {
          attendanceId: updated.id,
          eventTitle: attendance.event_title,
          hours: totalHours,
          certificateId: certResult.rows[0].id,
        },
      });
    } else {
      // Just notify task completion
      await notifyUser({
        userId: attendance.volunteer_user_id,
        email: attendance.volunteer_email,
        title: '✅ Task Completed!',
        message: `Your attendance for "${attendance.event_title}" has been confirmed. You earned ${updated.hours || 0} hours. Complete all your daily tasks to get your certificate!`,
        type: 'completion',
        metadata: {
          attendanceId: updated.id,
          eventTitle: attendance.event_title,
          hours: updated.hours,
        },
      });
    }
  }

  // Auto-notify when marked as no_show
  if (req.body.status === 'no_show' && attendance.status !== 'no_show') {
    await notifyUser({
      userId: attendance.volunteer_user_id,
      email: attendance.volunteer_email,
      title: '❌ Marked as Absent',
      message: `You were marked as absent for "${attendance.event_title}". If this is incorrect, please contact the organization.`,
      type: 'warning',
      metadata: { attendanceId: updated.id, eventTitle: attendance.event_title },
    });
  }

  res.json(updated);
});

export const verifyAttendance = asyncHandler(async (req, res) => {
  const { action } = req.body; // 'verify' or 'reject'
  const { reviewNotes } = req.body;

  const attendanceResult = await query(
    `SELECT att.*, e.organization_id, e.title AS event_title, e.opportunity_id,
            org.user_id AS organization_user_id,
            v.user_id AS volunteer_user_id, u.email AS volunteer_email, u.name AS volunteer_name
     FROM attendance att
     JOIN events e ON e.id = att.event_id
     JOIN organizations org ON org.id = e.organization_id
     JOIN volunteers v ON v.id = att.volunteer_id
     JOIN users u ON u.id = v.user_id
     WHERE att.id = $1`,
    [req.params.id]
  );

  const attendance = attendanceResult.rows[0];
  if (!attendance) throw new ApiError(404, 'Attendance record not found');

  if (req.user.role !== 'admin' && attendance.organization_user_id !== req.user.id) {
    throw new ApiError(403, 'You cannot verify this attendance record');
  }

  if (attendance.verification_status !== 'pending') {
    throw new ApiError(400, `This attendance has already been ${attendance.verification_status}`);
  }

  const newVerificationStatus = action === 'verify' ? 'verified' : 'rejected';
  const now = new Date().toISOString();

  const { rows } = await query(
    `UPDATE attendance
     SET verification_status = $2::varchar,
         verified_at = $3,
         verified_by = $4,
         status = CASE WHEN $2::varchar = 'verified' THEN 'attended' ELSE status END,
         notes = COALESCE($5::text, notes),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [req.params.id, newVerificationStatus, now, req.user.id, reviewNotes || null]
  );

  const updated = rows[0];

  if (newVerificationStatus === 'verified') {
    let totalHours = parseFloat(updated.hours || 0);

    if (attendance.notes?.includes('5 days')) {
      const { rows: completedRows } = await query(
        `SELECT SUM(hours) as total_hours, count(*) as count FROM attendance att
         JOIN events e ON e.id = att.event_id
         WHERE att.volunteer_id = $1 AND e.opportunity_id = $2 AND att.notes LIKE '%5 days%' AND att.verification_status = 'verified'`,
        [attendance.volunteer_id, attendance.opportunity_id]
      );
      if (completedRows[0].count >= 5) {
        totalHours = parseFloat(completedRows[0].total_hours || 0);

        // Auto-generate certificate for completed 5-day tasks
        const certificateNumber = generateCertificateNumber();
        const issuedAt = new Date();

        const orgResult = await query(`SELECT name FROM organizations WHERE id = $1`, [
          attendance.organization_id,
        ]);
        const organizationName = orgResult.rows[0]?.name || 'Volunteer Hub';

        const { fileUrl } = await generateCertificatePdf({
          certificateNumber,
          volunteerName: attendance.volunteer_name,
          organizationName,
          title: 'Certificate of Volunteer Service',
          hours: totalHours,
          issuedAt,
          eventTitle: attendance.event_title,
        });

        const certResult = await query(
          `INSERT INTO certificates (
             volunteer_id, event_id, opportunity_id, certificate_number, title, hours, issued_by, issued_at, file_url, metadata
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING *`,
          [
            attendance.volunteer_id,
            attendance.event_id,
            attendance.opportunity_id,
            certificateNumber,
            'Certificate of Volunteer Service',
            totalHours,
            req.user.id,
            issuedAt,
            fileUrl,
            JSON.stringify({
              eventTitle: attendance.event_title,
              autoVerified: true,
              fiveDayCompletion: true,
            }),
          ]
        );

        await notifyUser({
          userId: attendance.volunteer_user_id,
          email: attendance.volunteer_email,
          title: '🎉 5-Day Challenge Complete & Certificate Ready!',
          message: `Amazing ${attendance.volunteer_name}! You completed all 5 daily tasks. Your certificate for ${totalHours} hours is ready to download!`,
          type: 'completion',
          metadata: {
            attendanceId: updated.id,
            eventTitle: attendance.event_title,
            hours: totalHours,
            certificateId: certResult.rows[0].id,
            fiveDayCompletion: true,
          },
        });
      } else {
        await notifyUser({
          userId: attendance.volunteer_user_id,
          email: attendance.volunteer_email,
          title: '✅ Daily Task Verified!',
          message: `Your daily task for "${attendance.event_title}" has been verified. ${completedRows[0].count}/5 days complete. Keep going!`,
          type: 'completion',
          metadata: {
            attendanceId: updated.id,
            eventTitle: attendance.event_title,
            progress: `${completedRows[0].count}/5`,
          },
        });
      }
    } else {
      await notifyUser({
        userId: attendance.volunteer_user_id,
        email: attendance.volunteer_email,
        title: '✅ Task Verified!',
        message: `Your attendance for "${attendance.event_title}" has been verified. You earned ${updated.hours || 0} hours.`,
        type: 'completion',
        metadata: {
          attendanceId: updated.id,
          eventTitle: attendance.event_title,
          hours: updated.hours,
        },
      });
    }
  } else {
    await notifyUser({
      userId: attendance.volunteer_user_id,
      email: attendance.volunteer_email,
      title: '❌ Task Verification Rejected',
      message: `Your attendance for "${attendance.event_title}" was rejected. Reason: ${reviewNotes || 'No reason provided'}. If you believe this is an error, please contact the organization.`,
      type: 'warning',
      metadata: {
        attendanceId: updated.id,
        eventTitle: attendance.event_title,
        reason: reviewNotes,
      },
    });
  }

  res.json(updated);
});
