import jwt from 'jsonwebtoken';

// Obtener secrets de las variables de entorno
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';

// ============================================
// TIPOS
// ============================================

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  airlineId: string | null;
}

export interface RefreshTokenPayload {
  userId: string;
}

// ============================================
// ACCESS TOKEN (Short-lived: 15 minutos)
// ============================================

/**
 * Generate an access token (JWT)
 * @param payload - User data to include in token
 * @returns Signed JWT token
 */
export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: '15m', // 15 minutos
  });
};

/**
 * Verify and decode an access token
 * @param token - JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export const verifyAccessToken = (token: string): AccessTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
    return decoded;
  } catch (error) {
    // Token inválido o expirado
    return null;
  }
};

// ============================================
// REFRESH TOKEN (Long-lived: 30 días)
// ============================================

/**
 * Generate a refresh token (JWT)
 * @param payload - Minimal user data
 * @returns Signed JWT token
 */
export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: '30d', // 30 días
  });
};

/**
 * Verify and decode a refresh token
 * @param token - JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
    return decoded;
  } catch (error) {
    // Token inválido o expirado
    return null;
  }
};