import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = user =>
  jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    env.jwtAccessSecret,
    { expiresIn: env.accessTokenTtl }
  );

export const signRefreshToken = user =>
  jwt.sign(
    {
      sub: user.id,
      role: user.role,
      type: 'refresh',
    },
    env.jwtRefreshSecret,
    { expiresIn: env.refreshTokenTtl }
  );

export const signTempToken = payload => jwt.sign(payload, env.jwtAccessSecret, { expiresIn: '5m' });

export const verifyAccessToken = token => jwt.verify(token, env.jwtAccessSecret);

export const verifyRefreshToken = token => jwt.verify(token, env.jwtRefreshSecret);

export const verifyTempToken = token => jwt.verify(token, env.jwtAccessSecret);
