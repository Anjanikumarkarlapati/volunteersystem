import { query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import {
  findOrganizationById,
  findOrganizationByUserId,
  listOrganizations,
} from '../models/organization.model.js';

const updateableFields = [
  'name',
  'mission',
  'description',
  'website',
  'contact_phone',
  'address',
  'city',
  'state',
  'country',
  'logo_url',
];

const updateOrganization = async (organizationId, payload) => {
  const sets = [];
  const values = [];

  for (const field of updateableFields) {
    if (payload[field] !== undefined) {
      values.push(payload[field]);
      sets.push(`${field} = $${values.length}`);
    }
  }

  if (!sets.length) {
    return findOrganizationById(organizationId);
  }

  values.push(organizationId);
  const { rows } = await query(
    `UPDATE organizations
     SET ${sets.join(', ')}
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  return rows[0];
};

export const getMyOrganizationProfile = asyncHandler(async (req, res) => {
  const profile = await findOrganizationByUserId(req.user.id);
  if (!profile) {
    throw new ApiError(404, 'Organization profile not found');
  }

  res.json(profile);
});

export const updateMyOrganizationProfile = asyncHandler(async (req, res) => {
  const profile = await findOrganizationByUserId(req.user.id);
  if (!profile) {
    throw new ApiError(404, 'Organization profile not found');
  }

  const updated = await updateOrganization(profile.id, req.body);
  res.json(updated);
});

export const getOrganization = asyncHandler(async (req, res) => {
  const organization = await findOrganizationById(req.params.id);
  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  res.json(organization);
});

export const listOrganizationProfiles = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const verified = req.query.verified === undefined ? undefined : req.query.verified === 'true';
  const { organizations, total } = await listOrganizations({
    limit,
    offset,
    search: req.query.search,
    verified,
  });

  res.json({
    data: organizations,
    meta: getPaginationMeta(page, limit, total),
  });
});

export const verifyOrganization = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE organizations
     SET verified = $2
     WHERE id = $1
     RETURNING *`,
    [req.params.id, req.body.verified ?? true]
  );

  if (!rows[0]) {
    throw new ApiError(404, 'Organization not found');
  }

  res.json(rows[0]);
});
