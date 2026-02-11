import {prisma} from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken 
} from '../utils/jwt';
import crypto from 'crypto';

export class AuthService {
  /**
   * LOGIN: Authenticate user and return tokens
   */
  async login(email: string, password: string) {
    // 1. Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { airline: true }, // Incluir datos de la aerolínea
    });

    // 2. Validar que el usuario existe y está activo
    if (!user || !user.active) {
      throw new Error('Invalid credentials');
    }

    // 3. Verificar password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // 4. Actualizar última fecha de login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // 5. Generar Access Token (15 min)
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      airlineId: user.airlineId,
    });

    // 6. Generar Refresh Token (30 días)
    const refreshToken = generateRefreshToken({
      userId: user.id,
    });

    // 7. Guardar Refresh Token en la BD
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 días

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    // 8. Retornar tokens y datos del usuario (sin password)
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        airlineId: user.airlineId,
        airline: user.airline,
      },
    };
  }

  /**
   * REFRESH TOKEN: Generate new access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    // 1. Verificar que el refresh token es válido (JWT)
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new Error('Invalid refresh token');
    }

    // 2. Buscar el token en la base de datos
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: { airline: true },
        },
      },
    });

    // 3. Validar que existe y no ha expirado
    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    // 4. Validar que el usuario sigue activo
    if (!storedToken.user.active) {
      throw new Error('User is not active');
    }

    // 5. Generar nuevo Access Token
    const accessToken = generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      airlineId: storedToken.user.airlineId,
    });

    // 6. Retornar nuevo access token y datos del usuario
    return {
      accessToken,
      refreshToken,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        firstName: storedToken.user.firstName,
        lastName: storedToken.user.lastName,
        role: storedToken.user.role,
        airlineId: storedToken.user.airlineId,
        airline: storedToken.user.airline,
      },
    };
  }

  /**
   * LOGOUT: Invalidate refresh token
   */
  async logout(refreshToken: string) {
    // Eliminar el refresh token de la base de datos
    await prisma.refreshToken
      .delete({
        where: { token: refreshToken },
      })
      .catch(() => {
        // Si no existe, no hacer nada (ya estaba deslogueado)
      });
  }

  /**
   * REQUEST PASSWORD RESET: Generate reset token and send email
   */
  async requestPasswordReset(email: string) {
    // 1. Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Por seguridad, no revelar si el usuario existe o no
    if (!user || !user.active) {
      return; // Silently return
    }

    // 2. Generar token de reset (random)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hora

    // 3. Guardar token en la BD
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // 4. TODO: Enviar email con el link de reset
    // Por ahora solo retornamos el token para testing
    console.log(`Reset token for ${email}: ${resetToken}`);
    // En producción: await emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  /**
   * RESET PASSWORD: Change password using reset token
   */
  async resetPassword(token: string, newPassword: string) {
    // 1. Buscar usuario por reset token
    const user = await prisma.user.findUnique({
      where: { resetToken: token },
    });

    // 2. Validar que existe y el token no ha expirado
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new Error('Invalid or expired reset token');
    }

    // 3. Hashear nueva contraseña
    const hashedPassword = await hashPassword(newPassword);

    // 4. Actualizar contraseña y limpiar tokens
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // 5. Invalidar todos los refresh tokens (por seguridad)
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });
  }
}