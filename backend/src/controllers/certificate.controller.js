import fs from 'fs';
import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { findVolunteerByUserId } from '../models/volunteer.model.js';
import {
  certificatePathFor,
  generateCertificateNumber,
  generateCertificatePdf,
} from '../services/certificate.service.js';
import { notifyUser } from '../services/notification.service.js';

const getCertificateDetails = async certificateId => {
  const { rows } = await query(
    `SELECT c.*, vu.name AS volunteer_name, vu.email AS volunteer_email, v.user_id AS volunteer_user_id,
      e.title AS event_title, e.organization_id AS event_organization_id,
      op.organization_id AS opportunity_organization_id,
      COALESCE(event_org.name, opportunity_org.name, 'Volunteer Hub') AS organization_name,
      COALESCE(event_org.user_id, opportunity_org.user_id) AS organization_user_id
     FROM certificates c
     JOIN volunteers v ON v.id = c.volunteer_id
     JOIN users vu ON vu.id = v.user_id
     LEFT JOIN events e ON e.id = c.event_id
     LEFT JOIN organizations event_org ON event_org.id = e.organization_id
     LEFT JOIN opportunities op ON op.id = c.opportunity_id
     LEFT JOIN organizations opportunity_org ON opportunity_org.id = op.organization_id
     WHERE c.id = $1`,
    [certificateId]
  );

  return rows[0];
};

const ensureCanAccessCertificate = (user, certificate) => {
  if (user.role === 'admin') {
    return;
  }

  if (user.role === 'volunteer' && certificate.volunteer_user_id === user.id) {
    return;
  }

  if (user.role === 'organization' && certificate.organization_user_id === user.id) {
    return;
  }

  throw new ApiError(403, 'You cannot access this certificate');
};

export const createCertificate = asyncHandler(async (req, res) => {
  const volunteerResult = await query(
    `SELECT v.*, u.name AS volunteer_name, u.email AS volunteer_email, u.id AS volunteer_user_id
     FROM volunteers v
     JOIN users u ON u.id = v.user_id
     WHERE v.id = $1`,
    [req.body.volunteer_id]
  );
  const volunteer = volunteerResult.rows[0];

  if (!volunteer) {
    throw new ApiError(404, 'Volunteer not found');
  }

  const orgResult = await query(
    `SELECT COALESCE(event_org.id, opportunity_org.id) AS organization_id,
      COALESCE(event_org.name, opportunity_org.name, 'Volunteer Hub') AS organization_name,
      COALESCE(event_org.user_id, opportunity_org.user_id) AS organization_user_id,
      e.title AS event_title
     FROM (SELECT $1::uuid AS event_id, $2::uuid AS opportunity_id) input
     LEFT JOIN events e ON e.id = input.event_id
     LEFT JOIN organizations event_org ON event_org.id = e.organization_id
     LEFT JOIN opportunities op ON op.id = input.opportunity_id
     LEFT JOIN organizations opportunity_org ON opportunity_org.id = op.organization_id`,
    [req.body.event_id || null, req.body.opportunity_id || null]
  );
  const organization = orgResult.rows[0];

  if (req.user.role === 'organization' && organization.organization_user_id !== req.user.id) {
    throw new ApiError(403, 'You cannot issue a certificate for this resource');
  }

  const certificateNumber = generateCertificateNumber();
  const issuedAt = new Date();
  const { fileUrl } = await generateCertificatePdf({
    certificateNumber,
    volunteerName: volunteer.volunteer_name,
    organizationName: organization.organization_name,
    title: req.body.title || 'Certificate of Volunteer Service',
    hours: req.body.hours || volunteer.total_hours,
    issuedAt,
    eventTitle: organization.event_title,
  });

  const { rows } = await query(
    `INSERT INTO certificates (
       volunteer_id, event_id, opportunity_id, certificate_number, title, hours, issued_by, issued_at, file_url, metadata
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      volunteer.id,
      req.body.event_id || null,
      req.body.opportunity_id || null,
      certificateNumber,
      req.body.title || 'Certificate of Volunteer Service',
      req.body.hours || volunteer.total_hours,
      req.user.id,
      issuedAt,
      fileUrl,
      JSON.stringify(req.body.metadata || {}),
    ]
  );

  await notifyUser({
    userId: volunteer.volunteer_user_id,
    email: volunteer.volunteer_email,
    title: 'Certificate issued',
    message: `Your certificate ${certificateNumber} is ready to download.`,
    type: 'certificate',
    metadata: { certificateId: rows[0].id, certificateNumber },
  });

  res.status(201).json(rows[0]);
});

export const listMyCertificates = asyncHandler(async (req, res) => {
  const volunteer = await findVolunteerByUserId(req.user.id);
  if (!volunteer) {
    throw new ApiError(404, 'Volunteer profile not found');
  }

  const { rows } = await query(
    `SELECT c.*, e.title AS event_title, op.title AS opportunity_title
     FROM certificates c
     LEFT JOIN events e ON e.id = c.event_id
     LEFT JOIN opportunities op ON op.id = c.opportunity_id
     WHERE c.volunteer_id = $1
     ORDER BY c.issued_at DESC`,
    [volunteer.id]
  );

  res.json(rows);
});

export const listCertificates = asyncHandler(async (req, res) => {
  const values = [];
  const conditions = [];

  if (req.user.role === 'organization') {
    values.push(req.user.id);
    conditions.push(`COALESCE(event_org.user_id, opportunity_org.user_id) = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await query(
    `SELECT c.*, vu.name AS volunteer_name, e.title AS event_title, op.title AS opportunity_title
     FROM certificates c
     JOIN volunteers v ON v.id = c.volunteer_id
     JOIN users vu ON vu.id = v.user_id
     LEFT JOIN events e ON e.id = c.event_id
     LEFT JOIN organizations event_org ON event_org.id = e.organization_id
     LEFT JOIN opportunities op ON op.id = c.opportunity_id
     LEFT JOIN organizations opportunity_org ON opportunity_org.id = op.organization_id
     ${where}
     ORDER BY c.issued_at DESC`,
    values
  );

  res.json(rows);
});

export const downloadCertificate = asyncHandler(async (req, res) => {
  const certificate = await getCertificateDetails(req.params.id);
  if (!certificate) {
    throw new ApiError(404, 'Certificate not found');
  }

  ensureCanAccessCertificate(req.user, certificate);

  const filePath = certificatePathFor(certificate.certificate_number);
  if (!fs.existsSync(filePath)) {
    await generateCertificatePdf({
      certificateNumber: certificate.certificate_number,
      volunteerName: certificate.volunteer_name,
      organizationName: certificate.organization_name,
      title: certificate.title,
      hours: certificate.hours,
      issuedAt: certificate.issued_at,
      eventTitle: certificate.event_title,
    });
  }

  res.download(filePath, `${certificate.certificate_number}.pdf`);
});

export const issueCertificatesFromEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { volunteerIds, hoursMap, title } = req.body;

  const eventResult = await query(
    `SELECT e.*, org.name AS organization_name, org.user_id AS organization_user_id
     FROM events e
     JOIN organizations org ON org.id = e.organization_id
     WHERE e.id = $1`,
    [eventId]
  );
  const event = eventResult.rows[0];

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  if (req.user.role !== 'admin' && event.organization_user_id !== req.user.id) {
    throw new ApiError(403, 'You cannot issue certificates for this event');
  }

  if (!volunteerIds?.length) {
    throw new ApiError(400, 'At least one volunteer ID is required');
  }

  const issuedCertificates = [];

  for (const volunteerId of volunteerIds) {
    const volunteerResult = await query(
      `SELECT v.*, u.name AS volunteer_name, u.email AS volunteer_email, u.id AS volunteer_user_id
       FROM volunteers v
       JOIN users u ON u.id = v.user_id
       WHERE v.id = $1`,
      [volunteerId]
    );
    const volunteer = volunteerResult.rows[0];

    if (!volunteer) continue;

    const attendanceResult = await query(
      `SELECT * FROM attendance WHERE event_id = $1 AND volunteer_id = $2`,
      [eventId, volunteerId]
    );
    const attendance = attendanceResult.rows[0];

    if (!attendance || attendance.status !== 'attended') continue;

    const existingCert = await query(
      `SELECT id FROM certificates WHERE event_id = $1 AND volunteer_id = $2`,
      [eventId, volunteerId]
    );
    if (existingCert.rows.length) continue;

    const certificateNumber = generateCertificateNumber();
    const issuedAt = new Date();
    const hours = hoursMap?.[volunteerId] || attendance.hours || 0;

    const { fileUrl } = await generateCertificatePdf({
      certificateNumber,
      volunteerName: volunteer.volunteer_name,
      organizationName: event.organization_name,
      title: title || 'Certificate of Volunteer Service',
      hours,
      issuedAt,
      eventTitle: event.title,
    });

    const { rows } = await query(
      `INSERT INTO certificates (
         volunteer_id, event_id, opportunity_id, certificate_number, title, hours, issued_by, issued_at, file_url, metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        volunteerId,
        eventId,
        null,
        certificateNumber,
        title || 'Certificate of Volunteer Service',
        hours,
        req.user.id,
        issuedAt,
        fileUrl,
        JSON.stringify({ eventTitle: event.title, autoIssued: true }),
      ]
    );

    const certificate = rows[0];
    issuedCertificates.push(certificate);

    await notifyUser({
      userId: volunteer.volunteer_user_id,
      email: volunteer.volunteer_email,
      title: 'Certificate issued',
      message: `Your certificate ${certificateNumber} for ${event.title} is ready to download.`,
      type: 'certificate',
      metadata: { certificateId: certificate.id, certificateNumber },
    });
  }

  res.status(201).json({ issued: issuedCertificates.length, certificates: issuedCertificates });
});
