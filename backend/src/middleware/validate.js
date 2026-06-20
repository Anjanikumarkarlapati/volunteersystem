import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export const validate = (req, _res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  console.error('Validation errors:', result.array(), 'req body:', req.body);
  throw new ApiError(422, 'Validation failed', result.array());
};
