import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { env } from '../config/env.js';

const certificateDir = path.resolve(env.uploadsDir, 'certificates');

export const generateCertificateNumber = () => {
  const year = new Date().getFullYear();
  const suffix = `${Date.now()}`.slice(-8);
  return `CERT-${year}-${suffix}`;
};

export const certificatePathFor = certificateNumber =>
  path.join(certificateDir, `${certificateNumber}.pdf`);

export const generateCertificatePdf = async ({
  certificateNumber,
  volunteerName,
  organizationName,
  title,
  hours,
  issuedAt,
  eventTitle,
}) => {
  fs.mkdirSync(certificateDir, { recursive: true });
  const filePath = certificatePathFor(certificateNumber);

  await new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: 'LETTER', margin: 64 });
    const stream = fs.createWriteStream(filePath);

    stream.on('finish', resolve);
    stream.on('error', reject);
    document.on('error', reject);
    document.pipe(stream);

    document.rect(32, 32, 548, 728).lineWidth(2).stroke('#2563eb');
    document.fontSize(28).fillColor('#111827').text(title, { align: 'center' });
    document.moveDown(1.5);
    document
      .fontSize(13)
      .fillColor('#64748b')
      .text('This certificate is proudly presented to', { align: 'center' });
    document.moveDown(0.6);
    document.fontSize(30).fillColor('#0f172a').text(volunteerName, { align: 'center' });
    document.moveDown(0.8);
    document
      .fontSize(14)
      .fillColor('#334155')
      .text(
        `In recognition of ${Number(hours).toFixed(1)} volunteer hours${eventTitle ? ` contributed to ${eventTitle}` : ''}.`,
        { align: 'center' }
      );
    document.moveDown(1.2);
    document
      .fontSize(13)
      .text(`Issued by ${organizationName || 'Volunteer Hub'}`, { align: 'center' });
    document.moveDown(2.4);
    document
      .fontSize(11)
      .fillColor('#64748b')
      .text(`Certificate No. ${certificateNumber}`, { align: 'center' });
    document.text(`Issued ${new Date(issuedAt || Date.now()).toLocaleDateString()}`, {
      align: 'center',
    });

    document.end();
  });

  return {
    filePath,
    fileUrl: `/uploads/certificates/${certificateNumber}.pdf`,
  };
};
