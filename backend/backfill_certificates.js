import 'dotenv/config';
import { query } from './src/config/db.js';
import {
  generateCertificateNumber,
  generateCertificatePdf,
} from './src/services/certificate.service.js';

async function backfillCertificates() {
  console.log('Fetching completed attendance records without certificates...');

  const { rows: attendances } = await query(`
    SELECT att.id as attendance_id, att.volunteer_id, att.event_id, e.opportunity_id,
           att.hours, u.name as volunteer_name, e.title as event_title, org.name as organization_name
    FROM attendance att
    JOIN events e ON e.id = att.event_id
    JOIN volunteers v ON v.id = att.volunteer_id
    JOIN users u ON u.id = v.user_id
    JOIN organizations org ON org.id = e.organization_id
    LEFT JOIN certificates c ON c.event_id = att.event_id AND c.volunteer_id = att.volunteer_id
    WHERE (att.status = 'attended' OR att.verification_status = 'verified')
      AND c.id IS NULL
  `);

  console.log(`Found ${attendances.length} records needing certificates.`);

  let count = 0;
  for (const att of attendances) {
    try {
      const totalHours = parseFloat(att.hours || 0);
      const certificateNumber = generateCertificateNumber();
      const issuedAt = new Date();

      console.log(`Generating certificate for ${att.volunteer_name} - ${att.event_title}...`);

      const { fileUrl } = await generateCertificatePdf({
        certificateNumber,
        volunteerName: att.volunteer_name,
        organizationName: att.organization_name || 'Volunteer Hub',
        title: 'Certificate of Volunteer Service',
        hours: totalHours,
        issuedAt,
        eventTitle: att.event_title,
      });

      await query(
        `INSERT INTO certificates (
           volunteer_id, event_id, opportunity_id, certificate_number, title, hours, issued_at, file_url, metadata
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          att.volunteer_id,
          att.event_id,
          att.opportunity_id,
          certificateNumber,
          'Certificate of Volunteer Service',
          totalHours,
          issuedAt,
          fileUrl,
          JSON.stringify({
            eventTitle: att.event_title,
            autoVerified: true,
            backfilled: true,
          }),
        ]
      );
      count++;
    } catch (error) {
      console.error(`Failed to generate for attendance ${att.attendance_id}:`, error);
    }
  }

  console.log(`Successfully backfilled ${count} certificates.`);
  process.exit(0);
}

backfillCertificates();
