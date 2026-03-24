// src/services/email.service.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_QBNiBFV4_LoUPFBDcfxpSKV5AzapCEbuE');

export class EmailService {
  /**
   * Enviar email de reset de contraseña
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName?: string
  ): Promise<void> {
    try {
      // Construir URL de reset
      // Para desarrollo: usa localhost
      // Para producción: usa tu dominio real
      const resetUrl = process.env.NODE_ENV === 'production'
  ? `artsclaims://reset-password?token=${resetToken}` // Deep link para producción
  : `http://localhost:3000/reset-password?token=${resetToken}`;

      // HTML del email
      const htmlContent = this.getResetEmailTemplate(userName || 'User', resetUrl);

      // Enviar email
      const { data, error } = await resend.emails.send({
        from: 'ARTS Claims <onboarding@resend.dev>', // ⚠️ Cambiar por tu dominio verificado
        to: email,
        subject: 'Reset Your Password - ARTS Claims',
        html: htmlContent,
      });

      if (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send reset email');
      }

      console.log('Reset email sent successfully:', data);
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }

  /**
   * Template HTML del email de reset
   */
  private getResetEmailTemplate(userName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f5f5f5;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <!-- Email Container -->
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #123157; padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                        ARTS Claims
                      </h1>
                      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">
                        Aerospace Risk Transfer Solutions
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #123157; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                        Reset Your Password
                      </h2>
                      
                      <p style="color: #333333; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                        Hello ${userName},
                      </p>
                      
                      <p style="color: #333333; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                        We received a request to reset your password for your ARTS Claims account. 
                        Click the button below to create a new password:
                      </p>
                      
                      <!-- Reset Button -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${resetUrl}" 
                               style="display: inline-block; background-color: #123157; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #666666; margin: 20px 0 0 0; font-size: 14px; line-height: 1.6;">
                        Or copy and paste this link into your browser:
                      </p>
                      
                      <p style="color: #2E5283; margin: 10px 0 20px 0; font-size: 14px; word-break: break-all;">
                        ${resetUrl}
                      </p>
                      
                      <div style="border-top: 1px solid #e0e0e0; margin: 30px 0; padding-top: 20px;">
                        <p style="color: #999999; margin: 0; font-size: 13px; line-height: 1.6;">
                          <strong>Security Note:</strong> This link will expire in 1 hour. 
                          If you didn't request a password reset, you can safely ignore this email.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                      <p style="color: #999999; margin: 0 0 10px 0; font-size: 13px;">
                        © ${new Date().getFullYear()} ARTS Claims. All rights reserved.
                      </p>
                      <p style="color: #999999; margin: 0; font-size: 12px;">
                        This is an automated email. Please do not reply.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  /**
   * Email de bienvenida (opcional)
   */
  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    try {
      const { data, error } = await resend.emails.send({
        from: 'ARTS Claims <onboarding@resend.dev>',
        to: email,
        subject: 'Welcome to ARTS Claims',
        html: `
          <h1>Welcome ${userName}!</h1>
          <p>Thank you for joining ARTS Claims.</p>
        `,
      });

      if (error) {
        console.error('Error sending welcome email:', error);
      }
    } catch (error) {
      console.error('Welcome email error:', error);
      // No throw - este email no es crítico
    }
  }
}

export const emailService = new EmailService();