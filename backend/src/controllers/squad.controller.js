import { query, withTransaction } from '../config/db.js';
import { findVolunteerByUserId } from '../models/volunteer.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

let tablesReady = false;

const ensureSquadTables = async () => {
  if (tablesReady) return;

  await query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS squads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(140) NOT NULL,
      description TEXT,
      created_by UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS squad_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
      volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
      role VARCHAR(40) NOT NULL DEFAULT 'member',
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (squad_id, volunteer_id)
    );

    CREATE INDEX IF NOT EXISTS idx_squad_members_volunteer_id ON squad_members(volunteer_id);
    CREATE INDEX IF NOT EXISTS idx_squad_members_squad_id ON squad_members(squad_id);
  `);

  tablesReady = true;
};

const requireVolunteer = async userId => {
  const volunteer = await findVolunteerByUserId(userId);
  if (!volunteer) throw new ApiError(404, 'Volunteer profile not found');
  return volunteer;
};

const getSquadDetail = async (squadId, volunteerId) => {
  const membership = await query(
    'SELECT id FROM squad_members WHERE squad_id = $1 AND volunteer_id = $2',
    [squadId, volunteerId]
  );

  if (!membership.rows.length) {
    throw new ApiError(403, 'You are not a member of this squad');
  }

  const [squad, members, impact] = await Promise.all([
    query(
      `SELECT s.*,
        u.name AS created_by_name,
        COUNT(sm.id)::int AS member_count
       FROM squads s
       JOIN volunteers creator ON creator.id = s.created_by
       JOIN users u ON u.id = creator.user_id
       LEFT JOIN squad_members sm ON sm.squad_id = s.id
       WHERE s.id = $1
       GROUP BY s.id, u.name`,
      [squadId]
    ),
    query(
      `SELECT sm.id AS membership_id, sm.role, sm.joined_at,
        v.id AS volunteer_id, v.total_hours, u.name, u.email,
        COUNT(att.id) FILTER (WHERE att.status = 'attended')::int AS completed_events
       FROM squad_members sm
       JOIN volunteers v ON v.id = sm.volunteer_id
       JOIN users u ON u.id = v.user_id
       LEFT JOIN attendance att ON att.volunteer_id = v.id AND att.status = 'attended'
       WHERE sm.squad_id = $1
       GROUP BY sm.id, v.id, u.id
       ORDER BY sm.role DESC, sm.joined_at ASC`,
      [squadId]
    ),
    query(
      `SELECT
        COALESCE(SUM(v.total_hours), 0)::numeric AS total_hours,
        COUNT(DISTINCT att.id) FILTER (WHERE att.status = 'attended')::int AS completed_events,
        MAX(e.start_at) FILTER (WHERE att.status = 'attended') AS last_activity
       FROM squad_members sm
       JOIN volunteers v ON v.id = sm.volunteer_id
       LEFT JOIN attendance att ON att.volunteer_id = v.id
       LEFT JOIN events e ON e.id = att.event_id
       WHERE sm.squad_id = $1`,
      [squadId]
    ),
  ]);

  return {
    ...squad.rows[0],
    members: members.rows,
    impact: impact.rows[0],
  };
};

export const listMySquads = asyncHandler(async (req, res) => {
  await ensureSquadTables();
  const volunteer = await requireVolunteer(req.user.id);

  const { rows } = await query(
    `SELECT s.*,
      sm.role AS my_role,
      COUNT(DISTINCT member.id)::int AS member_count,
      COALESCE(SUM(v.total_hours), 0)::numeric AS total_hours,
      COUNT(DISTINCT att.id) FILTER (WHERE att.status = 'attended')::int AS completed_events,
      MAX(e.start_at) FILTER (WHERE att.status = 'attended') AS last_activity
     FROM squad_members sm
     JOIN squads s ON s.id = sm.squad_id
     LEFT JOIN squad_members member ON member.squad_id = s.id
     LEFT JOIN volunteers v ON v.id = member.volunteer_id
     LEFT JOIN attendance att ON att.volunteer_id = v.id
     LEFT JOIN events e ON e.id = att.event_id
     WHERE sm.volunteer_id = $1
     GROUP BY s.id, sm.role
     ORDER BY s.created_at DESC`,
    [volunteer.id]
  );

  res.json({ data: rows });
});

export const createSquad = asyncHandler(async (req, res) => {
  await ensureSquadTables();
  const volunteer = await requireVolunteer(req.user.id);
  const { name, description } = req.body;

  const squad = await withTransaction(async client => {
    const created = await client.query(
      `INSERT INTO squads (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description || null, volunteer.id]
    );
    await client.query(
      `INSERT INTO squad_members (squad_id, volunteer_id, role)
       VALUES ($1, $2, 'captain')`,
      [created.rows[0].id, volunteer.id]
    );
    return created.rows[0];
  });

  res.status(201).json(await getSquadDetail(squad.id, volunteer.id));
});

export const addSquadMember = asyncHandler(async (req, res) => {
  await ensureSquadTables();
  const volunteer = await requireVolunteer(req.user.id);
  const { volunteer_id: invitedVolunteerId } = req.body;

  const role = await query(
    `SELECT role FROM squad_members WHERE squad_id = $1 AND volunteer_id = $2`,
    [req.params.id, volunteer.id]
  );
  if (!role.rows.length) throw new ApiError(403, 'You are not a member of this squad');

  const invited = await query('SELECT id FROM volunteers WHERE id = $1', [invitedVolunteerId]);
  if (!invited.rows.length) throw new ApiError(404, 'Volunteer ID not found');

  await query(
    `INSERT INTO squad_members (squad_id, volunteer_id)
     VALUES ($1, $2)
     ON CONFLICT (squad_id, volunteer_id) DO NOTHING`,
    [req.params.id, invitedVolunteerId]
  );

  res.json(await getSquadDetail(req.params.id, volunteer.id));
});

export const getSquad = asyncHandler(async (req, res) => {
  await ensureSquadTables();
  const volunteer = await requireVolunteer(req.user.id);
  res.json(await getSquadDetail(req.params.id, volunteer.id));
});
