import nodemailer from 'nodemailer';
import { smtpConfig } from '../smtp';

/**
 * Service d'envoi d'emails simplifié
 * En production, utiliser SendGrid, AWS SES, etc.
 */

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string; // Added optional text property
  from?: string;
}

/**
 * Envoie un email (simulation pour le moment)
 */
export async function sendEmail(emailData: EmailData): Promise<void> {
  console.log('📧 Tentative d\'envoi d\'email:', {
    to: emailData.to,
    subject: emailData.subject,
    from: emailData.from || smtpConfig.auth.user,
    timestamp: new Date().toISOString(),
  });

  try {
    const transporter = nodemailer.createTransport(smtpConfig);

    const info = await transporter.sendMail({
      from: emailData.from || smtpConfig.auth.user,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    });

    console.log('📧 Email envoyé avec succès:', {
      messageId: info.messageId,
      response: info.response,
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    throw new Error('Erreur d\'envoi d\'email');
  }
}
