/**
 * Email service for sending transactional emails
 *
 * This module uses nodemailer to send emails through a Gmail account
 * with an app password for authentication.
 */

import nodemailer from 'nodemailer';

// Create reusable transport using Gmail with app password authentication
let transporter = null;

/**
 * Initialize the email transporter
 * This function should be called before sending any emails
 */
export function initTransporter() {
  // Only initialize once
  if (transporter) return;

  // Check if the required environment variables are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.warn('Email service not configured: EMAIL_USER or EMAIL_APP_PASSWORD is missing');
    return;
  }

  // Create the transporter with Gmail
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
}

/**
 * Send a password reset email
 *
 * @param {Object} recipient - Recipient information
 * @param {string} recipient.email - Recipient email address
 * @param {string} recipient.name - Recipient name
 * @param {string} token - Password reset token
 * @param {string} resetUrl - Base URL for the password reset page
 * @returns {Promise<boolean>} - True if email was sent successfully
 */
export async function sendPasswordResetEmail(recipient, token, resetUrl) {
  try {
    initTransporter();

    if (!transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    // Construct the full reset URL
    const fullResetUrl = `${resetUrl}?token=${token}`;

    // Define email options
    const mailOptions = {
      from: {
        name: 'AA Companion',
        address: process.env.EMAIL_USER,
      },
      to: recipient.email,
      subject: 'Password Reset Request - AA Companion',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2C3E50;">Reset Your Password</h2>
          <p>Hello ${recipient.name},</p>
          <p>We received a request to reset your password for your AA Companion account. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${fullResetUrl}" style="background-color: #5DA6A7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 1px; font-weight: bold;">Reset Password</a>
          </div>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Regards,<br>
            The AA Companion Team
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      `,
      text: `
        Reset Your Password

        Hello ${recipient.name},

        We received a request to reset your password for your AA Companion account.

        To reset your password, please visit this link:
        ${fullResetUrl}

        This link will expire in 1 hour for security reasons.

        If you didn't request a password reset, please ignore this email or contact support if you have concerns.

        Regards,
        The AA Companion Team
      `,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

/**
 * Send a password change confirmation email
 *
 * @param {Object} recipient - Recipient information
 * @param {string} recipient.email - Recipient email address
 * @param {string} recipient.name - Recipient name
 * @returns {Promise<boolean>} - True if email was sent successfully
 */
export async function sendPasswordChangeConfirmationEmail(recipient) {
  try {
    initTransporter();

    if (!transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    // Define email options
    const mailOptions = {
      from: {
        name: 'AA Companion',
        address: process.env.EMAIL_USER,
      },
      to: recipient.email,
      subject: 'Password Changed - AA Companion',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2C3E50;">Password Changed Successfully</h2>
          <p>Hello ${recipient.name},</p>
          <p>Your password for AA Companion has been successfully changed.</p>
          <p>If you did not make this change, please contact support immediately.</p>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Regards,<br>
            The AA Companion Team
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      `,
      text: `
        Password Changed Successfully

        Hello ${recipient.name},

        Your password for AA Companion has been successfully changed.

        If you did not make this change, please contact support immediately.

        Regards,
        The AA Companion Team
      `,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Password change confirmation email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send password change confirmation email:', error);
    return false;
  }
}

/**
 * Format a reflection for email delivery
 *
 * @param {Object} reflection - Reflection object
 * @returns {Object} - Formatted email content with HTML and text versions
 */
export function formatReflectionForEmail(reflection) {
  if (!reflection) return null;

  const title = reflection.title || '';
  const quote = reflection.quote || '';
  // Handle comment - ensure it's a string and not a boolean or other type
  let comment = '';
  const rawComment = reflection.commentCleaned || reflection.comment;
  if (rawComment && typeof rawComment === 'string') {
    comment = rawComment.trim();
  } else if (rawComment && typeof rawComment !== 'string') {
    // If comment exists but is not a string (e.g., boolean true), skip it
    console.warn(`Reflection ${reflection.month}-${reflection.day} has non-string comment:`, typeof rawComment, rawComment);
    comment = '';
  }
  const reference = reflection.reference || '';
  const dateKey = `${String(reflection.month).padStart(2, '0')}-${String(reflection.day).padStart(2, '0')}`;

  // Format date as "Month Day" (e.g., "January 8")
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const formattedDate = `${months[reflection.month - 1]} ${reflection.day}`;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                  process.env.NEXTAUTH_URL ||
                  'https://aa-companion.app';
  const reflectionUrl = `${baseUrl}/${dateKey}`;

  // Build image URL - try JPG first, then PNG
  const imageUrl = `${baseUrl}/reflections/${dateKey}.jpg`;
  const imageUrlPng = `${baseUrl}/reflections/${dateKey}.png`;

  // HTML version
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #5DA6A7; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Daily Reflection</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">${formattedDate}</p>
      </div>

      <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-top: none;">
        <!-- Reflection Image -->
        <div style="text-align: center; padding: 0; margin: 0; background-color: #f9f9f9;">
          <img
            src="${imageUrl}"
            alt="${title || 'Daily Reflection'}"
            style="width: 100%; max-width: 600px; height: auto; display: block; margin: 0; padding: 0; border: none;"
            onerror="this.onerror=null; this.src='${imageUrlPng}';"
          />
        </div>

        <div style="padding: 30px;">
          ${title ? `<h2 style="color: #2C3E50; margin-top: 0; font-size: 22px;">${title}</h2>` : ''}

        ${quote ? `
          <div style="background-color: rgba(99, 102, 241, 0.04); padding: 20px; margin: 20px 0; border-left: 4px solid #5DA6A7; border-radius: 1px;">
            <p style="font-style: italic; font-size: 16px; line-height: 1.7; color: #2C3E50; margin: 0;">
              "${quote}"
            </p>
          </div>
        ` : ''}

        ${comment ? `
          <div style="margin: 20px 0; line-height: 1.7; color: #333; white-space: pre-wrap;">
            ${comment.replace(/\n/g, '<br>')}
          </div>
        ` : ''}

        ${reference ? `
          <p style="font-style: italic; color: #666; font-size: 14px; margin-top: 20px;">
            — ${reference}
          </p>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center;">
          <p style="color: #666; font-size: 12px; margin: 0; text-align: center;">
            From the book Daily Reflections.<br>
            Copyright © 1990 by Alcoholics Anonymous World Services, Inc. All rights reserved.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${reflectionUrl}" style="background-color: #5DA6A7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 1px; font-weight: bold; display: inline-block;">
            View Full Reflection
          </a>
        </div>
        </div>
      </div>

      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none;">
        <p style="color: #666; font-size: 14px; margin: 0; text-align: center;">
          You're receiving this because you enabled email notifications for daily reflections.
        </p>
        <p style="color: #999; font-size: 12px; margin: 10px 0 0 0; text-align: center;">
          <a href="${baseUrl}/profile" style="color: #5DA6A7; text-decoration: none;">Manage notification preferences</a>
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">
        This is an automated message from AA Companion. Please do not reply to this email.
      </p>
    </div>
  `;

  // Plain text version
  const text = `
Daily Reflection - ${formattedDate}

${title ? `${title}\n\n` : ''}${quote ? `"${quote}"\n\n` : ''}${comment ? `${comment}\n\n` : ''}${reference ? `— ${reference}\n\n` : ''}
From the book Daily Reflections.
Copyright © 1990 by Alcoholics Anonymous World Services, Inc. All rights reserved.

View today's full reflection: ${reflectionUrl}

You're receiving this because you enabled email notifications for daily reflections.
Manage notification preferences: ${baseUrl}/profile

---
This is an automated message from AA Companion. Please do not reply to this email.
  `.trim();

  return { html, text, subject: title || `Daily Reflection - ${formattedDate}` };
}

/**
 * Send a daily reflection email
 *
 * @param {Object} recipient - Recipient information
 * @param {string} recipient.email - Recipient email address
 * @param {string} recipient.name - Recipient name
 * @param {Object} reflection - Reflection object to send
 * @returns {Promise<Object>} - Result object with success status and messageId
 */
export async function sendDailyReflectionEmail(recipient, reflection) {
  try {
    initTransporter();

    if (!transporter) {
      console.error('Email transporter not initialized');
      return {
        success: false,
        error: 'Email transporter not initialized'
      };
    }

    // Format the reflection for email
    const formatted = formatReflectionForEmail(reflection);
    if (!formatted) {
      return {
        success: false,
        error: 'Failed to format reflection for email'
      };
    }

    // Define email options
    const mailOptions = {
      from: {
        name: 'AA Companion',
        address: process.env.EMAIL_USER,
      },
      to: recipient.email,
      subject: formatted.subject,
      html: formatted.html,
      text: formatted.text,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Daily reflection email sent: %s', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      status: 'sent'
    };
  } catch (error) {
    console.error('Failed to send daily reflection email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send daily reflection email',
      status: 'failed'
    };
  }
}

/**
 * Check if a user can receive emails at the current time
 * based on their quiet hours preferences
 *
 * @param {Object} preferences - User's notification preferences
 * @param {Date} currentTime - Current time to check against
 * @returns {boolean} - Whether email can be sent now
 */
export function canSendEmailDuringQuietHours(preferences, currentTime = new Date()) {
  if (!preferences || !preferences.quietHoursStart || !preferences.quietHoursEnd) {
    // Default quiet hours: 9PM - 7AM
    return !(currentTime.getHours() >= 21 || currentTime.getHours() < 7);
  }

  // Parse the quiet hours settings
  const startParts = preferences.quietHoursStart.split(':').map(Number);
  const endParts = preferences.quietHoursEnd.split(':').map(Number);

  const quietStartHour = startParts[0];
  const quietEndHour = endParts[0];

  const currentHour = currentTime.getHours();

  // Check if current time is within quiet hours
  if (quietStartHour > quietEndHour) {
    // Quiet hours span midnight (e.g., 9PM - 7AM)
    return !(currentHour >= quietStartHour || currentHour < quietEndHour);
  } else {
    // Quiet hours within same day (e.g., 11PM - 6AM)
    return !(currentHour >= quietStartHour && currentHour < quietEndHour);
  }
}

/**
 * Send an application approved email notification
 *
 * @param {Object} recipient - Recipient information
 * @param {string} recipient.email - Recipient email address
 * @param {string} recipient.name - Recipient name
 * @returns {Promise<boolean>} - True if email was sent successfully
 */
export async function sendApplicationApprovedEmail(recipient) {
  try {
    initTransporter();

    if (!transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                    process.env.NEXTAUTH_URL ||
                    'https://aa-companion.app';
    const dashboardUrl = `${baseUrl}/volunteers/dashboard`;

    // Define email options
    const mailOptions = {
      from: {
        name: 'AA Companion',
        address: process.env.EMAIL_USER,
      },
      to: recipient.email,
      subject: 'Volunteer Application Approved - AA Companion',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #5DA6A7; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Application Approved!</h1>
          </div>

          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
            <p>Hello ${recipient.name},</p>

            <p>Congratulations! We're excited to inform you that your volunteer application has been <strong>approved</strong>.</p>

            <p>Thank you for your willingness to help support fellow members in recovery. Your experience and commitment to service will make a difference in the lives of others seeking connection and support.</p>

            <h3>Next Steps:</h3>
            <ol>
              <li>Visit your volunteer dashboard to see available shifts and schedule your availability</li>
              <li>Complete the brief orientation if you haven't already</li>
              <li>Start connecting with members who need support</li>
            </ol>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" style="background-color: #5DA6A7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 1px; font-weight: bold; display: inline-block;">
                Go to Volunteer Dashboard
              </a>
            </div>

            <p>If you have any questions about your role or responsibilities, please don't hesitate to reach out to us.</p>

            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Thank you for your service,<br>
              The AA Companion Team
            </p>
          </div>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none;">
            <p style="color: #666; font-size: 14px; margin: 0; text-align: center;">
              You're receiving this email because you applied to be a volunteer with AA Companion.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated message from AA Companion. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `
Application Approved!

Hello ${recipient.name},

Congratulations! We're excited to inform you that your volunteer application has been approved.

Thank you for your willingness to help support fellow members in recovery. Your experience and commitment to service will make a difference in the lives of others seeking connection and support.

Next Steps:
1. Visit your volunteer dashboard to see available shifts and schedule your availability
2. Complete the brief orientation if you haven't already
3. Start connecting with members who need support

Go to Volunteer Dashboard: ${dashboardUrl}

If you have any questions about your role or responsibilities, please don't hesitate to reach out to us.

Thank you for your service,
The AA Companion Team

---
You're receiving this email because you applied to be a volunteer with AA Companion.
This is an automated message. Please do not reply to this email.
      `,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Application approved email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send application approved email:', error);
    return false;
  }
}

/**
 * Send an application rejected email notification
 *
 * @param {Object} recipient - Recipient information
 * @param {string} recipient.email - Recipient email address
 * @param {string} recipient.name - Recipient name
 * @param {string} reason - Reason for rejection
 * @returns {Promise<boolean>} - True if email was sent successfully
 */
export async function sendApplicationRejectedEmail(recipient, reason) {
  try {
    initTransporter();

    if (!transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                    process.env.NEXTAUTH_URL ||
                    'https://aa-companion.app';
    const applyUrl = `${baseUrl}/volunteers/apply`;

    // Define email options
    const mailOptions = {
      from: {
        name: 'AA Companion',
        address: process.env.EMAIL_USER,
      },
      to: recipient.email,
      subject: 'Volunteer Application Status Update - AA Companion',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #5DA6A7; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Application Status Update</h1>
          </div>

          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
            <p>Hello ${recipient.name},</p>

            <p>Thank you for your interest in volunteering with AA Companion. We appreciate the time you took to submit your application.</p>

            <p>After careful review, we regret to inform you that we are unable to approve your application at this time.</p>

            ${reason ? `
            <div style="background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-left: 4px solid #5DA6A7;">
              <p style="margin: 0;"><strong>Feedback:</strong> ${reason}</p>
            </div>
            ` : ''}

            <p>Please know that this decision doesn't diminish the value of your recovery journey or your desire to be of service. There are many ways to be helpful in the fellowship, both within AA Companion and in your local community.</p>

            <p>You're welcome to apply again in the future, especially if your circumstances change.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}" style="background-color: #5DA6A7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 1px; font-weight: bold; display: inline-block;">
                Return to AA Companion
              </a>
            </div>

            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Wishing you all the best,<br>
              The AA Companion Team
            </p>
          </div>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none;">
            <p style="color: #666; font-size: 14px; margin: 0; text-align: center;">
              You're receiving this email because you applied to be a volunteer with AA Companion.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated message from AA Companion. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `
Application Status Update

Hello ${recipient.name},

Thank you for your interest in volunteering with AA Companion. We appreciate the time you took to submit your application.

After careful review, we regret to inform you that we are unable to approve your application at this time.

${reason ? `Feedback: ${reason}\n\n` : ''}

Please know that this decision doesn't diminish the value of your recovery journey or your desire to be of service. There are many ways to be helpful in the fellowship, both within AA Companion and in your local community.

You're welcome to apply again in the future, especially if your circumstances change.

Return to AA Companion: ${baseUrl}

Wishing you all the best,
The AA Companion Team

---
You're receiving this email because you applied to be a volunteer with AA Companion.
This is an automated message. Please do not reply to this email.
      `,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Application rejected email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send application rejected email:', error);
    return false;
  }
}