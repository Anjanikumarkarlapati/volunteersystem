import { query } from '../config/db.js';

const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const getIpAddress = req => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }

  return req.ip?.replace('::ffff:', '') || null;
};

export const auditLogger = (req, res, next) => {
  res.on('finish', () => {
    if (!mutatingMethods.has(req.method) || res.statusCode >= 400) {
      return;
    }

    const [, entityType, entityId] = req.path.split('/');

    query(
      `INSERT INTO activity_logs (actor_user_id, action, entity_type, entity_id, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user?.id || null,
        `${req.method} ${req.originalUrl}`,
        entityType || null,
        /^[0-9a-f-]{36}$/i.test(entityId || '') ? entityId : null,
        getIpAddress(req),
        req.headers['user-agent'] || null,
        JSON.stringify({ statusCode: res.statusCode }),
      ]
    ).catch(error => {
      console.error('Failed to write audit log', error);
    });
  });

  next();
};
