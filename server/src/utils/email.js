import nodemailer from 'nodemailer';
import config from '../config/env.js';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false, // true for 465, false for other ports
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

/**
 * Send employee onboarding email with login credentials
 * @param {Object} params - Email parameters
 * @param {string} params.toEmail - Employee email
 * @param {string} params.name - Employee name
 * @param {string} params.role - Employee role
 * @param {string} params.pumpName - Pump name
 * @param {string} params.tempPassword - Temporary password
 * @returns {Promise} Email send result
 */
export const sendOnboardingEmail = async ({
  toEmail,
  name,
  role,
  pumpName,
  tempPassword,
}) => {
  const subject = `Welcome to ${pumpName} – Your Account Details`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
        .credentials { background-color: #fff; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to FuelFlow</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>You have been added as <strong>${role}</strong> at <strong>${pumpName}</strong>.</p>
          
          <div class="credentials">
            <h3>Your Login Credentials:</h3>
            <p><strong>Login URL:</strong> ${config.appBaseUrl}/login</p>
            <p><strong>Username/Email:</strong> ${toEmail}</p>
            <p><strong>Temporary Password:</strong> <code>${tempPassword}</code></p>
          </div>
          
          <p><strong>Important:</strong> For security reasons, please change your password after your first login. You can also reset your password anytime using the "Forgot Password" option on the login page.</p>
          
          <a href="${config.appBaseUrl}/login" class="button">Login to Your Account</a>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} FuelFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to FuelFlow

Hello ${name},

You have been added as ${role} at ${pumpName}.

Your Login Credentials:
- Login URL: ${config.appBaseUrl}/login
- Username/Email: ${toEmail}
- Temporary Password: ${tempPassword}

Important: For security reasons, please change your password after your first login. You can also reset your password anytime using the "Forgot Password" option on the login page.

This is an automated message. Please do not reply to this email.

© ${new Date().getFullYear()} FuelFlow. All rights reserved.
  `;

  const mailOptions = {
    from: config.smtp.from,
    to: toEmail,
    subject,
    text,
    html,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send password reset email
 * @param {Object} params - Email parameters
 * @param {string} params.toEmail - User email
 * @param {string} params.name - User name
 * @param {string} params.resetToken - Password reset token
 * @returns {Promise} Email send result
 */
export const sendPasswordResetEmail = async ({ toEmail, name, resetToken }) => {
  const resetUrl = `${config.appBaseUrl}/reset-password/${resetToken}`;
  const subject = 'Password Reset Request - FuelFlow';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>We received a request to reset your password for your FuelFlow account.</p>
          
          <a href="${resetUrl}" class="button">Reset Your Password</a>
          
          <div class="warning">
            <p><strong>Important Security Notice:</strong></p>
            <ul>
              <li>This link will expire in <strong>1 hour</strong></li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Never share this link with anyone</li>
            </ul>
          </div>
          
          <p>If the button doesn't work, copy and paste this URL into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} FuelFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Password Reset Request - FuelFlow

Hello ${name},

We received a request to reset your password for your FuelFlow account.

Click the link below to reset your password:
${resetUrl}

Important Security Notice:
- This link will expire in 1 hour
- If you didn't request this reset, please ignore this email
- Never share this link with anyone

This is an automated message. Please do not reply to this email.

© ${new Date().getFullYear()} FuelFlow. All rights reserved.
  `;

  const mailOptions = {
    from: config.smtp.from,
    to: toEmail,
    subject,
    text,
    html,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send supplier order email
 * @param {Object} params - Email parameters
 * @param {string} params.toEmail - Supplier email
 * @param {string} params.supplierName - Supplier name
 * @param {string} params.pumpName - Pump name
 * @param {string} params.pumpAddress - Pump address
 * @param {string} params.managerEmail - Manager email
 * @param {string} params.orderRefNo - Order reference number
 * @param {Array} params.items - Order items [{fuelType, quantity}]
 * @param {string} params.scheduledDate - Scheduled delivery date
 * @param {string} params.scheduledSlot - Scheduled delivery slot
 * @returns {Promise} Email send result
 */
export const sendSupplierOrderEmail = async ({
  toEmail,
  supplierName,
  pumpName,
  pumpAddress,
  managerEmail,
  orderRefNo,
  items,
  scheduledDate,
  scheduledSlot,
}) => {
  const subject = `New Fuel Order from ${pumpName} - ${orderRefNo}`;

  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.fuelType}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.quantity} L</td>
    </tr>
  `
    )
    .join('');

  const itemsText = items
    .map((item) => `- ${item.fuelType}: ${item.quantity} L`)
    .join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background-color: #2196F3; color: white; padding: 10px; text-align: left; }
        .info-box { background-color: #fff; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Fuel Order</h1>
          <p>Order Reference: ${orderRefNo}</p>
        </div>
        <div class="content">
          <p>Dear ${supplierName},</p>
          <p>We would like to place a new fuel order with the following details:</p>
          
          <div class="info-box">
            <h3>Delivery Location:</h3>
            <p><strong>${pumpName}</strong></p>
            <p>${pumpAddress}</p>
          </div>
          
          ${scheduledDate ? `
          <div class="info-box">
            <h3>Scheduled Delivery:</h3>
            <p><strong>Date:</strong> ${scheduledDate}</p>
            ${scheduledSlot ? `<p><strong>Time Slot:</strong> ${scheduledSlot}</p>` : ''}
          </div>
          ` : ''}
          
          <h3>Order Items:</h3>
          <table>
            <thead>
              <tr>
                <th>Fuel Type</th>
                <th style="text-align: right;">Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div class="info-box">
            <p><strong>Contact Person:</strong> ${managerEmail}</p>
            <p>Please confirm receipt of this order and provide an estimated delivery time.</p>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated message from FuelFlow.</p>
          <p>&copy; ${new Date().getFullYear()} FuelFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
New Fuel Order - ${orderRefNo}

Dear ${supplierName},

We would like to place a new fuel order with the following details:

Delivery Location:
${pumpName}
${pumpAddress}

${scheduledDate ? `Scheduled Delivery:\nDate: ${scheduledDate}\n${scheduledSlot ? `Time Slot: ${scheduledSlot}\n` : ''}` : ''}

Order Items:
${itemsText}

Contact Person: ${managerEmail}

Please confirm receipt of this order and provide an estimated delivery time.

This is an automated message from FuelFlow.

© ${new Date().getFullYear()} FuelFlow. All rights reserved.
  `;

  const mailOptions = {
    from: config.smtp.from,
    to: toEmail,
    replyTo: managerEmail,
    subject,
    text,
    html,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send termination email to employee
 * @param {Object} params - Email parameters
 * @param {string} params.toEmail - Employee email
 * @param {string} params.name - Employee name
 * @param {string} params.pumpName - Pump name
 * @param {string} params.reason - Termination reason
 * @returns {Promise} Email send result
 */
export const sendTerminationEmail = async ({ toEmail, name, pumpName, reason }) => {
  const subject = `Important: Employment Termination Notification - ${pumpName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
        .warning { background-color: #fee2e2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Employment Termination Notice</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p>We regret to inform you that your employment at <strong>${pumpName}</strong> has been terminated.</p>
          
          <div class="warning">
            <h3>Reason for Termination:</h3>
            <p>${reason}</p>
          </div>
          
          <p><strong>Important Notice:</strong></p>
          <ul>
            <li>Your access to the FuelFlow system has been revoked immediately</li>
            <li>Your account and associated data have been removed from our system</li>
            <li>You will no longer be able to log in to the system</li>
          </ul>
          
          <p>If you have any questions or believe this termination was made in error, please contact your administrator.</p>
          
          <p>Thank you for your service.</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} FuelFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Employment Termination Notice

Dear ${name},

We regret to inform you that your employment at ${pumpName} has been terminated.

Reason for Termination:
${reason}

Important Notice:
- Your access to the FuelFlow system has been revoked immediately
- Your account and associated data have been removed from our system
- You will no longer be able to log in to the system

If you have any questions or believe this termination was made in error, please contact your administrator.

Thank you for your service.

This is an automated message. Please do not reply to this email.

© ${new Date().getFullYear()} FuelFlow. All rights reserved.
  `;

  const mailOptions = {
    from: config.smtp.from,
    to: toEmail,
    subject,
    text,
    html,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send reinstatement email to employee
 * @param {Object} params - Email parameters
 * @param {string} params.toEmail - Employee email
 * @param {string} params.name - Employee name
 * @param {string} params.pumpName - Pump name
 * @param {string} params.role - Employee role
 * @returns {Promise} Email send result
 */
export const sendReinstatementEmail = async ({ toEmail, name, pumpName, role }) => {
  const subject = `Welcome Back! Reinstatement Notification - ${pumpName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
        .info-box { background-color: #d1fae5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome Back to FuelFlow!</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p>We are pleased to inform you that you have been <strong>reinstated</strong> at <strong>${pumpName}</strong> as <strong>${role}</strong>.</p>
          
          <div class="info-box">
            <h3>Your Account Has Been Reactivated</h3>
            <p>Your access to the FuelFlow system has been restored with the following details:</p>
            <p><strong>Role:</strong> ${role}</p>
            <p><strong>Location:</strong> ${pumpName}</p>
          </div>
          
          <p><strong>Next Steps:</strong></p>
          <ul>
            <li>You can now log in to the system using your existing credentials</li>
            <li>If you've forgotten your password, use the "Forgot Password" option</li>
            <li>Contact your manager or administrator if you have any questions</li>
          </ul>
          
          <a href="${config.appBaseUrl}/login" class="button">Login to Your Account</a>
          
          <p>We look forward to having you back on the team!</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} FuelFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome Back to FuelFlow!

Dear ${name},

We are pleased to inform you that you have been reinstated at ${pumpName} as ${role}.

Your Account Has Been Reactivated
Your access to the FuelFlow system has been restored with the following details:
- Role: ${role}
- Location: ${pumpName}

Next Steps:
- You can now log in to the system using your existing credentials
- If you've forgotten your password, use the "Forgot Password" option
- Contact your manager or administrator if you have any questions

Login URL: ${config.appBaseUrl}/login

We look forward to having you back on the team!

This is an automated message. Please do not reply to this email.

© ${new Date().getFullYear()} FuelFlow. All rights reserved.
  `;

  const mailOptions = {
    from: config.smtp.from,
    to: toEmail,
    subject,
    text,
    html,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send payroll notification email to employee
 * @param {Object} params - Email parameters
 * @param {string} params.toEmail - Employee email
 * @param {string} params.employeeName - Employee name
 * @param {string} params.pumpName - Pump name
 * @param {string} params.managerName - Manager name who approved payment
 * @param {string} params.periodStart - Period start date
 * @param {string} params.periodEnd - Period end date
 * @param {number} params.hoursWorked - Total hours worked
 * @param {number} params.hourlyRate - Hourly rate
 * @param {number} params.grossPay - Gross pay amount
 * @param {number} params.deductions - Deductions amount
 * @param {number} params.netPay - Net pay amount
 * @returns {Promise} Email send result
 */
export const sendPayrollNotificationEmail = async ({
  toEmail,
  employeeName,
  pumpName,
  managerName,
  periodStart,
  periodEnd,
  hoursWorked,
  hourlyRate,
  grossPay,
  deductions,
  netPay,
}) => {
  const subject = `Payment Processed - ${pumpName} Payroll`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
        .payslip { background-color: #fff; padding: 20px; border: 1px solid #ddd; margin: 20px 0; }
        .payslip-header { border-bottom: 2px solid #10B981; padding-bottom: 10px; margin-bottom: 15px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .row.total { font-weight: bold; font-size: 1.1em; border-top: 2px solid #10B981; border-bottom: 2px solid #10B981; margin-top: 10px; }
        .label { color: #666; }
        .value { font-weight: 600; }
        .info-box { background-color: #d1fae5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Payment Processed</h1>
        </div>
        <div class="content">
          <p>Dear ${employeeName},</p>
          <p>Your payment for the period <strong>${periodStart}</strong> to <strong>${periodEnd}</strong> has been processed and marked as given by <strong>${managerName}</strong>.</p>
          
          <div class="payslip">
            <div class="payslip-header">
              <h2 style="margin: 0; color: #10B981;">Payslip Details</h2>
              <p style="margin: 5px 0 0 0; color: #666;">${pumpName}</p>
            </div>
            
            <div class="row">
              <span class="label">Period:</span>
              <span class="value">${periodStart} - ${periodEnd}</span>
            </div>
            
            <div class="row">
              <span class="label">Hours Worked:</span>
              <span class="value">${hoursWorked} hours</span>
            </div>
            
            <div class="row">
              <span class="label">Hourly Rate:</span>
              <span class="value">৳${hourlyRate.toFixed(2)}</span>
            </div>
            
            <div class="row">
              <span class="label">Gross Pay:</span>
              <span class="value">৳${grossPay.toFixed(2)}</span>
            </div>
            
            <div class="row">
              <span class="label">Deductions:</span>
              <span class="value">৳${deductions.toFixed(2)}</span>
            </div>
            
            <div class="row total">
              <span class="label">Net Pay:</span>
              <span class="value">৳${netPay.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="info-box">
            <p><strong>Approved By:</strong> ${managerName}</p>
            <p style="margin: 5px 0 0 0;">If you have any questions about this payment, please contact your manager.</p>
          </div>
          
          <p>Thank you for your hard work!</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} FuelFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Payment Processed - ${pumpName} Payroll

Dear ${employeeName},

Your payment for the period ${periodStart} to ${periodEnd} has been processed and marked as given by ${managerName}.

Payslip Details:
- Period: ${periodStart} - ${periodEnd}
- Hours Worked: ${hoursWorked} hours
- Hourly Rate: ৳${hourlyRate.toFixed(2)}
- Gross Pay: ৳${grossPay.toFixed(2)}
- Deductions: ৳${deductions.toFixed(2)}
- Net Pay: ৳${netPay.toFixed(2)}

Approved By: ${managerName}

If you have any questions about this payment, please contact your manager.

Thank you for your hard work!

This is an automated message. Please do not reply to this email.

© ${new Date().getFullYear()} FuelFlow. All rights reserved.
  `;

  const mailOptions = {
    from: config.smtp.from,
    to: toEmail,
    subject,
    text,
    html,
  };

  return await transporter.sendMail(mailOptions);
};

// Verify transporter configuration
export const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email server is ready to send messages'.green);
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:'.red, error.message);
    return false;
  }
};
