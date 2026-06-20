import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OAuth2Client } from 'google-auth-library';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';
import { updateRefreshTokenHash } from '../models/user.model.js';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const hashPassword = password => bcrypt.hash(password, 10);

export const comparePassword = (password, hash) => bcrypt.compare(password, hash);

export const issueTokenPair = async user => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await updateRefreshTokenHash(user.id, refreshTokenHash);

  return {
    accessToken,
    refreshToken,
  };
};

export const issueTokenPairWithClient = async (client, user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await client.query('UPDATE users SET refresh_token_hash = $2 WHERE id = $1', [
    user.id,
    refreshTokenHash,
  ]);

  return {
    accessToken,
    refreshToken,
  };
};

const googleClient = new OAuth2Client(env.google.clientId, env.google.clientSecret);

export const verifyGoogleIdToken = async idToken => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.google.clientId,
  });
  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Invalid Google ID token');
  }
  return payload;
};

export const downloadGooglePicture = async (pictureUrl, userId) => {
  if (!pictureUrl) return null;

  try {
    const uploadsDir = path.resolve(__dirname, '../../', env.uploadsDir, 'profiles');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const response = await fetch(pictureUrl);
    if (!response.ok) throw new Error('Failed to fetch profile picture');

    const buffer = await response.arrayBuffer();
    const ext = 'jpg';
    const filename = `${userId}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, Buffer.from(buffer));
    return `/uploads/profiles/${filename}`;
  } catch (error) {
    console.error('Failed to download Google profile picture:', error);
    return null;
  }
};

export const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

export const sendSmsOtp = async (phone, code) => {
  // TODO: Integrate with Twilio/Vonage/etc.
  // For development, log the OTP
  console.log(`[DEV] SMS OTP for ${phone}: ${code}`);
  return true;
};
