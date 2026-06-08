import nodemailer from 'nodemailer';
import type { Prisma } from '@prisma/client';
import prisma from './prisma';

let cachedTransporter: nodemailer.Transporter | null = null;

// Email configuration
const createTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  // Use generic SMTP settings. Hostinger example: smtp.hostinger.com, port 587 (TLS)
  const host = process.env.EMAIL_HOST || 'smtp.hostinger.com';
  const port = process.env.EMAIL_PORT ? Number.parseInt(process.env.EMAIL_PORT, 10) : 587;
  const secure = process.env.EMAIL_SECURE === undefined ? false : (process.env.EMAIL_SECURE === 'true'); // true for 465, false for 587

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  return cachedTransporter;
};

// Email template types
export type EmailTemplate = 
  | 'welcome'
  | 'course_purchase'
  | 'mock_purchase'
  | 'guidance_session'
  | 'subscription'
  | 'certificate'
  | 'instructor_approved'
  | 'custom';

interface EmailData {
  userName?: string;
  courseName?: string;
  mockName?: string;
  sessionName?: string;
  sessionDate?: string;
  sessionTime?: string;
  purchaseAmount?: string;
  additionalInfo?: string;
  // Instructor approval fields
  instructorName?: string;
  instructorEmail?: string;
  instructorTitle?: string;
  assignedCourses?: string[]; // course titles
  approvalNotes?: string;
}

// Email templates
const getEmailTemplate = (template: EmailTemplate, data: EmailData): { subject: string; html: string } => {
  // Auto-detect environment: Use NEXT_PUBLIC_APP_URL if set, 
  // otherwise use VERCEL_URL for production, fallback to localhost
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  
  // Dashboard link - use /redirecting which automatically routes to user's dashboard
  const dashboardUrl = `${baseUrl}/redirecting`;
  
  switch (template) {
    case 'welcome':
      return {
        subject: '🎉 Welcome to Unfiltered IITians - Your Journey Begins!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
              .button-secondary { background: #11998e; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
              .brand { color: #667eea; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎓 Welcome to Unfiltered IITians!</h1>
              </div>
              <div class="content">
                <h2>Hello ${data.userName || 'Student'}! 👋</h2>
                <p>We're thrilled to have you join our community of ambitious learners and future IITians!</p>
                
                <div class="highlight">
                  <strong>🚀 What's Next?</strong>
                  <ul>
                    <li>Explore our comprehensive courses</li>
                    <li>Take mock tests to assess your preparation</li>
                    <li>Book guidance sessions with mentors</li>
                    <li>Join our success stories community</li>
                  </ul>
                </div>
                
                <p>Your account has been successfully created, and you're all set to begin your learning journey with us.</p>
                
                <center>
                  <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
                  <a href="${baseUrl}/courses" class="button button-secondary">Browse Courses</a>
                </center>
                
                <p style="text-align: center; margin-top: 16px;">
                  Work with us? <a href="${baseUrl}/instructor-form" style="color: #667eea; font-weight: bold; text-decoration: underline;">Join as Instructor &rarr;</a>
                </p>
                
                <p><strong>Need Help?</strong><br>
                Our support team is here for you. Feel free to reach out at any time!</p>
                
                <p>Best regards,<br>
                <strong class="brand">Unfiltered IITians</strong><br>
                <em>by Divyanshu Darshna</em></p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Unfiltered IITians by Divyanshu Darshna. All rights reserved.</p>
                <p>This email was sent to you because you registered on our platform.</p>
                <p><a href="${baseUrl}" style="color: #667eea; text-decoration: none;">Visit Website</a></p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'course_purchase':
      return {
        subject: `✅ Course Purchase Confirmed - ${data.courseName || 'Your Course'}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #11998e; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
              .button-secondary { background: #667eea; }
              .purchase-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #11998e; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              .brand { color: #11998e; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Course Purchase Successful!</h1>
              </div>
              <div class="content">
                <h2>Congratulations, ${data.userName || 'Student'}!</h2>
                <p>Your course purchase has been confirmed. Get ready to elevate your learning!</p>
                
                <div class="purchase-details">
                  <h3>📚 Purchase Details</h3>
                  <p><strong>Course:</strong> ${data.courseName || 'N/A'}</p>
                  ${data.purchaseAmount ? `<p><strong>Amount Paid:</strong> ₹${data.purchaseAmount}</p>` : ''}
                  <p><strong>Purchase Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  ${data.additionalInfo ? `<p><strong>Access Until:</strong> ${data.additionalInfo}</p>` : ''}
                </div>
                
                <p>You can now access all course materials, videos, and resources immediately.</p>
                
                <center>
                  <a href="${baseUrl}/dashboard/courses" class="button">Access Your Course</a>
                  <a href="${baseUrl}/redirecting" class="button button-secondary">Go to Dashboard</a>
                </center>
                
                <p>Happy Learning! 🚀</p>
                
                <p>Best regards,<br>
                <strong class="brand">Unfiltered IITians</strong><br>
                <em>by Divyanshu Darshna</em></p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Unfiltered IITians by Divyanshu Darshna. All rights reserved.</p>
                <p><a href="${baseUrl}" style="color: #11998e; text-decoration: none;">Visit Website</a> | <a href="${baseUrl}/courses" style="color: #11998e; text-decoration: none;">Browse Courses</a></p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'mock_purchase':
      return {
        subject: `✅ Mock Test Purchase Confirmed - ${data.mockName || 'Your Mock Test'}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
              .button-secondary { background: #667eea; }
              .purchase-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #f5576c; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              .brand { color: #f5576c; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎯 Mock Test Purchase Confirmed!</h1>
              </div>
              <div class="content">
                <h2>Great Choice, ${data.userName || 'Student'}!</h2>
                <p>Your mock test purchase has been confirmed. Time to test your preparation!</p>
                
                <div class="purchase-details">
                  <h3>📝 Purchase Details</h3>
                  <p><strong>Mock Test:</strong> ${data.mockName || 'N/A'}</p>
                  ${data.purchaseAmount ? `<p><strong>Amount Paid:</strong> ₹${data.purchaseAmount}</p>` : ''}
                  <p><strong>Purchase Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                
                <p>You can now attempt your mock test. Good luck with your preparation!</p>
                
                <center>
                  <a href="${baseUrl}/mocks" class="button">Start Mock Test</a>
                  <a href="${dashboardUrl}" class="button button-secondary">Go to Dashboard</a>
                </center>
                
                <p><strong>Pro Tips:</strong></p>
                <ul>
                  <li>Find a quiet place to attempt the test</li>
                  <li>Ensure stable internet connection</li>
                  <li>Treat it like a real exam</li>
                </ul>
                
                <p>Best regards,<br>
                <strong class="brand">Unfiltered IITians</strong><br>
                <em>by Divyanshu Darshna</em></p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Unfiltered IITians by Divyanshu Darshna. All rights reserved.</p>
                <p><a href="${baseUrl}" style="color: #f5576c; text-decoration: none;">Visit Website</a> | <a href="${baseUrl}/courses" style="color: #f5576c; text-decoration: none;">Browse Courses</a></p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'guidance_session':
      return {
        subject: `📅 Guidance Session Booked - ${data.sessionName || data.sessionDate || 'Upcoming'}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                margin: 0;
                padding: 0;
                background-color: #070b12;
                color: #d8f7f4;
                font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
                line-height: 1.6;
              }
              .email-shell {
                background-color: #070b12;
                background-image:
                  linear-gradient(90deg, rgba(0, 210, 200, 0.12) 1px, transparent 1px),
                  linear-gradient(0deg, rgba(0, 210, 200, 0.12) 1px, transparent 1px),
                  radial-gradient(circle at 20% 30%, rgba(0, 230, 210, 0.08) 1px, transparent 1px),
                  radial-gradient(ellipse at 50% 100%, rgba(0, 170, 190, 0.18) 0%, transparent 70%);
                background-size: 48px 48px, 48px 48px, 16px 16px, 100% 100%;
                padding: 34px 14px;
              }
              .container {
                max-width: 640px;
                margin: 0 auto;
                background: #08121a;
                border: 1px solid rgba(64, 224, 208, 0.42);
                border-radius: 34px;
                overflow: hidden;
                box-shadow: 0 30px 50px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(0, 255, 210, 0.14);
              }
              .content { padding: 32px; }
              .confirm-header { margin-bottom: 24px; }
              .check-icon {
                display: inline-block;
                width: 58px;
                height: 58px;
                line-height: 58px;
                text-align: center;
                border-radius: 60px;
                background: linear-gradient(145deg, #1fd1b0, #0e9a8b);
                color: #ffffff;
                font-size: 30px;
                font-weight: 700;
                box-shadow: 0 10px 22px rgba(0, 210, 190, 0.35);
                border: 1px solid rgba(255, 255, 240, 0.35);
                vertical-align: middle;
              }
              .title-group {
                display: inline-block;
                vertical-align: middle;
                margin-left: 14px;
              }
              .title-group h1 {
                margin: 0;
                color: #ffffff;
                font-size: 30px;
                line-height: 1.18;
                letter-spacing: -0.4px;
              }
              .title-group p {
                margin: 5px 0 0;
                color: #9acfdd;
                font-size: 14px;
                font-weight: 600;
              }
              .intro { color: #c2e4f2; margin: 0 0 18px; }
              .student-name { color: #ffffff; font-weight: 700; }
              .session-details {
                background: rgba(0, 8, 15, 0.72);
                border: 1px solid rgba(0, 220, 200, 0.3);
                border-radius: 28px;
                padding: 24px;
                margin: 22px 0;
                box-shadow: 0 10px 18px rgba(0, 0, 0, 0.3);
              }
              .session-details h3 {
                margin: 0 0 16px;
                color: #edf8ff;
                font-size: 20px;
              }
              .detail-row {
                padding: 13px 0;
                border-bottom: 1px solid rgba(0, 255, 210, 0.16);
              }
              .detail-row:last-child { border-bottom: 0; }
              .label {
                color: #4ed4d0;
                display: block;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 1.5px;
                text-transform: uppercase;
              }
              .value {
                color: #edf8ff;
                display: block;
                font-size: 17px;
                font-weight: 700;
                margin-top: 3px;
              }
              .dashboard-instruction {
                background: rgba(2, 25, 35, 0.82);
                border: 1px solid rgba(64, 224, 200, 0.45);
                border-radius: 24px;
                margin: 20px 0 14px;
                padding: 20px;
              }
              .dashboard-instruction h4 {
                margin: 0 0 10px;
                color: #d3f5f0;
                font-size: 18px;
              }
              .dashboard-instruction p,
              .dashboard-instruction li { color: #c2e4f2; font-size: 14px; }
              .dashboard-instruction ul { margin: 12px 0 0; padding-left: 20px; }
              .dashboard-instruction li { margin: 8px 0; }
              .privacy-note {
                background: rgba(0, 0, 0, 0.28);
                border-left: 3px solid #27e0ca;
                border-radius: 18px;
                color: #b7eee6;
                font-size: 13px;
                margin-top: 14px;
                padding: 10px 12px;
              }
              .button {
                display: inline-block;
                padding: 14px 28px;
                background: linear-gradient(105deg, #19bfaa, #0f9b8a);
                color: #07141e !important;
                text-decoration: none;
                border-radius: 999px;
                font-weight: 800;
                margin: 12px 6px 0;
                box-shadow: 0 6px 14px rgba(0, 180, 170, 0.3);
              }
              .button-secondary {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(0, 210, 200, 0.6);
                color: #c9f3ee !important;
                box-shadow: none;
              }
              .signature { color: #c2e4f2; margin: 24px 0 0; }
              .brand { color: #4ed4d0; font-weight: 800; }
              .footer {
                border-top: 1px dashed rgba(64, 224, 208, 0.3);
                color: #559faf;
                font-size: 12px;
                margin-top: 26px;
                padding-top: 18px;
                text-align: center;
              }
              .footer a { color: #55f0df; text-decoration: none; }
              @media (max-width: 550px) {
                .email-shell { padding: 18px 10px; }
                .content { padding: 24px 18px; }
                .container { border-radius: 26px; }
                .title-group { display: block; margin: 12px 0 0; }
                .title-group h1 { font-size: 24px; }
                .button { display: block; text-align: center; margin-left: 0; margin-right: 0; }
              }
            </style>
          </head>
          <body>
            <div class="email-shell">
              <div class="container">
                <div class="content">
                  <div class="confirm-header">
                    <span class="check-icon">✓</span>
                    <div class="title-group">
                      <h1>Session Booked</h1>
                      <p>Your guidance session is confirmed and secured</p>
                    </div>
                  </div>

                  <p class="intro">Hello <span class="student-name">${data.userName || 'Student'}</span>,</p>
                  <p class="intro">Welcome to Unfiltered IITians. Your guidance session has been successfully booked, and we look forward to helping you with focused mentorship.</p>
                  
                  <div class="session-details">
                    <h3>📅 Session Details</h3>
                    ${data.sessionName ? `<div class="detail-row"><span class="label">Session</span><span class="value">${data.sessionName}</span></div>` : ''}
                    ${data.sessionDate ? `<div class="detail-row"><span class="label">Date</span><span class="value">${data.sessionDate}</span></div>` : ''}
                    ${data.sessionTime ? `<div class="detail-row"><span class="label">Time</span><span class="value">${data.sessionTime}</span></div>` : ''}
                    ${data.purchaseAmount ? `<div class="detail-row"><span class="label">Amount Paid</span><span class="value">₹${data.purchaseAmount}</span></div>` : ''}
                  </div>
                  
                  <div class="dashboard-instruction">
                    <h4>🎛️ Access your session via Dashboard</h4>
                    <p>Your secure meeting room will be available inside your dashboard. Follow these steps:</p>
                    <ul>
                      <li>Go to your dashboard using the button below.</li>
                      <li>Log in with the email used for booking.</li>
                      <li>Open your upcoming session and join when it is time.</li>
                      <li>Join 5 minutes early, prepare your questions, and keep a notebook handy.</li>
                    </ul>
                    <div class="privacy-note">The direct meeting link is not shared in this email. Dashboard access keeps your session private and secure.</div>
                  </div>
                  
                  <center>
                    <a href="${dashboardUrl}" class="button">Go to Dashboard →</a>
                    <a href="${baseUrl}/guidance" class="button button-secondary">Browse More Sessions</a>
                  </center>

                  <div class="dashboard-instruction">
                    <h4>⏰ Scheduling Information</h4>
                    <ul>
                      <li>Sessions happen during weekends between 12 PM and 5 PM.</li>
                      <li>Send your preferred timings to <a href="mailto:Support@divyanshudarshna.com" style="color: #55f0df; font-weight: 800;">Support@divyanshudarshna.com</a>.</li>
                    </ul>
                  </div>
                  
                  <p class="signature">Best regards,<br>
                  <strong class="brand">Unfiltered IITians</strong><br>
                  <em>by Divyanshu Darshna</em></p>

                  <div class="footer">
                    <p>© ${new Date().getFullYear()} Unfiltered IITians by Divyanshu Darshna. All rights reserved.</p>
                    <p><a href="${baseUrl}">Visit Website</a> | <a href="${baseUrl}/courses">Browse Courses</a></p>
                  </div>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'subscription':
      return {
        subject: '🌟 Subscription Activated - Welcome to Premium!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
              .button-secondary { background: #11998e; }
              .benefits { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              .brand { color: #667eea; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Subscription Activated!</h1>
              </div>
              <div class="content">
                <h2>Congratulations, ${data.userName || 'Student'}! 🌟</h2>
                <p>Your premium subscription is now active. Enjoy exclusive access to all our resources!</p>
                
                <div class="benefits">
                  <h3>✨ Your Premium Benefits</h3>
                  <ul>
                    <li>Access to all courses</li>
                    <li>Unlimited mock tests</li>
                    <li>Priority support</li>
                    <li>Exclusive webinars and materials</li>
                    <li>Early access to new content</li>
                  </ul>
                </div>
                
                ${data.additionalInfo ? `<p>${data.additionalInfo}</p>` : ''}
                
                <center>
                  <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
                  <a href="${baseUrl}/courses" class="button button-secondary">Explore Courses</a>
                </center>
                
                <p>Thank you for trusting us with your learning journey!</p>
                
                <p>Best regards,<br>
                <strong class="brand">Unfiltered IITians</strong><br>
                <em>by Divyanshu Darshna</em></p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Unfiltered IITians by Divyanshu Darshna. All rights reserved.</p>
                <p><a href="${baseUrl}" style="color: #667eea; text-decoration: none;">Visit Website</a> | <a href="${baseUrl}/courses" style="color: #667eea; text-decoration: none;">Browse Courses</a></p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'certificate':
      // Build public certificate URL using the certificate ID
      const certificateUrl = data.additionalInfo ? `${baseUrl}/certificate/${data.additionalInfo}` : `${baseUrl}/dashboard/courses`;
      
      return {
        subject: `🎓 Congratulations! Your Certificate for ${data.courseName || 'Course'} is Ready!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; position: relative; overflow: hidden; }
              .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }
              .header h1 { position: relative; z-index: 1; font-size: 28px; margin: 0; }
              .header .trophy { font-size: 48px; margin-bottom: 10px; }
              .content { background: #f9f9f9; padding: 35px; border-radius: 0 0 10px 10px; }
              .certificate-box { background: linear-gradient(to right, #f5f3ff, #fff); border: 2px solid #667eea; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.15); }
              .certificate-box h2 { color: #667eea; margin: 0 0 10px 0; font-size: 22px; }
              .certificate-box p { color: #666; margin: 5px 0; }
              .certificate-id { font-family: monospace; background: #f0f0f0; padding: 8px 16px; border-radius: 6px; display: inline-block; margin-top: 15px; font-size: 14px; color: #555; }
              .button { display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 8px; margin: 10px 5px; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); }
              .button-download { background: linear-gradient(135deg, #f59e0b, #d97706); }
              .button-secondary { background: linear-gradient(135deg, #11998e, #38ef7d); color: white; }
              .highlights { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              .highlights h3 { color: #667eea; margin: 0 0 15px 0; }
              .highlights ul { margin: 0; padding-left: 20px; }
              .highlights li { margin: 8px 0; color: #555; }
              .download-section { text-align: center; margin: 25px 0; padding: 25px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 12px; border: 2px dashed #f59e0b; }
              .download-section h3 { color: #92400e; margin: 0 0 10px 0; }
              .download-section p { margin: 0 0 15px 0; color: #78350f; }
              .share-section { text-align: center; margin: 25px 0; padding: 20px; background: #f5f5f5; border-radius: 8px; }
              .share-section p { margin: 0 0 10px 0; color: #666; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              .brand { color: #667eea; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="trophy">🏆</div>
                <h1>Congratulations, ${data.userName || 'Student'}!</h1>
                <p style="margin: 10px 0 0 0; position: relative; z-index: 1;">You've achieved something amazing!</p>
              </div>
              <div class="content">
                <p style="font-size: 16px; text-align: center;">We are thrilled to inform you that you have successfully completed:</p>
                
                <div class="certificate-box">
                  <h2>📜 ${data.courseName || 'Course'}</h2>
                  <p>Your dedication and hard work have paid off!</p>
                  ${data.additionalInfo ? `<div class="certificate-id">Certificate ID: ${data.additionalInfo}</div>` : ''}
                </div>
                
                <div class="download-section">
                  <h3>📥 Download Your Certificate</h3>
                  <p>Click the button below to view and download your certificate as PDF</p>
                  <a href="${certificateUrl}" class="button button-download" style="color: white;">View & Download Certificate</a>
                </div>
                
                <div class="highlights">
                  <h3>🌟 What This Means</h3>
                  <ul>
                    <li><strong>Skill Verified:</strong> You've demonstrated proficiency in this subject</li>
                    <li><strong>Achievement Unlocked:</strong> Add this to your portfolio and resume</li>
                    <li><strong>Permanent Record:</strong> Your certificate is stored securely in your account</li>
                    <li><strong>Shareable:</strong> Download and share your achievement on LinkedIn</li>
                  </ul>
                </div>
                
                <center>
                  <a href="${dashboardUrl}" class="button button-secondary">Go to Dashboard</a>
                </center>
                
                <div class="share-section">
                  <p>🎉 <strong>Proud of your achievement?</strong></p>
                  <p>Share your certificate link with friends and family!</p>
                  <p style="font-size: 12px; color: #888; word-break: break-all;">${certificateUrl}</p>
                </div>
                
                <p style="text-align: center;">Keep learning, keep growing. We're proud to be part of your journey!</p>
                
                <p style="margin-top: 30px;">Warm regards,<br>
                <strong class="brand">Divyanshu Darshna</strong><br>
                <em>Founder & Instructor, Unfiltered IITians</em></p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Unfiltered IITians by Divyanshu Darshna. All rights reserved.</p>
                <p><a href="${baseUrl}" style="color: #667eea; text-decoration: none;">Visit Website</a> | <a href="${baseUrl}/courses" style="color: #667eea; text-decoration: none;">Browse More Courses</a></p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'instructor_approved': {
      const name = data.instructorName || data.userName || 'Instructor';
      const title = data.instructorTitle ? `<p style="color:#555;margin:4px 0 0 0;font-size:14px;">${data.instructorTitle}</p>` : '';
      const coursesHtml = data.assignedCourses && data.assignedCourses.length > 0
        ? data.assignedCourses.map(c => `<li style="margin:6px 0;">${c}</li>`).join('')
        : '<li style="margin:6px 0;color:#888;">To be communicated separately</li>';
      const notesHtml = data.approvalNotes
        ? `<div style="background:#f0f9ff;border-left:4px solid #0ea5e9;padding:14px 18px;border-radius:0 6px 6px 0;margin:20px 0;">
             <p style="margin:0;font-size:14px;color:#0369a1;"><strong>A note from the team:</strong></p>
             <p style="margin:8px 0 0 0;font-size:14px;color:#0c4a6e;">${data.approvalNotes}</p>
           </div>`
        : '';
      const approvalDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

      return {
        subject: `Congratulations! You are now an Approved Instructor — Unfiltered IITians`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.7; color: #1a1a2e; margin: 0; padding: 0; background: #f4f6f9; }
              .wrapper { background: #f4f6f9; padding: 32px 16px; }
              .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
              .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); padding: 40px 36px 36px; text-align: center; position: relative; }
              .header-badge { display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: #fff; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; padding: 5px 14px; border-radius: 20px; margin-bottom: 16px; }
              .header h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.3px; }
              .header p { color: rgba(255,255,255,0.85); margin: 10px 0 0; font-size: 15px; }
              .content { padding: 36px; }
              .greeting { font-size: 18px; font-weight: 600; color: #1a1a2e; margin: 0 0 6px; }
              .intro { font-size: 15px; color: #4b5563; margin: 0 0 24px; }
              .approval-box { background: linear-gradient(135deg, #f5f3ff, #faf5ff); border: 2px solid #8b5cf6; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }
              .approval-icon { font-size: 44px; margin-bottom: 12px; }
              .approval-box h2 { color: #7c3aed; margin: 0 0 6px; font-size: 20px; font-weight: 700; }
              .approval-box p { color: #6b7280; margin: 0; font-size: 14px; }
              .approval-date { display: inline-block; background: #ede9fe; color: #5b21b6; font-size: 13px; font-weight: 600; padding: 4px 14px; border-radius: 20px; margin-top: 10px; }
              .section-title { font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin: 28px 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
              .courses-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px 22px; }
              .courses-box ul { margin: 0; padding-left: 20px; }
              .courses-box li { font-size: 15px; color: #374151; font-weight: 500; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
              .info-item { background: #f9fafb; border-radius: 8px; padding: 14px 16px; }
              .info-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin: 0 0 4px; }
              .info-value { font-size: 14px; color: #111827; font-weight: 600; margin: 0; }
              .cta-section { text-align: center; margin: 32px 0 20px; }
              .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(99,102,241,0.35); }
              .divider { border: none; border-top: 1px solid #f3f4f6; margin: 28px 0; }
              .closing { font-size: 15px; color: #4b5563; margin: 0 0 6px; }
              .signature { font-size: 15px; font-weight: 700; color: #1a1a2e; margin: 12px 0 2px; }
              .signature-role { font-size: 13px; color: #6b7280; margin: 0; }
              .footer { background: #f9fafb; padding: 20px 36px; text-align: center; border-top: 1px solid #f3f4f6; }
              .footer p { margin: 4px 0; color: #9ca3af; font-size: 12px; }
              .footer a { color: #6366f1; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="container">
                <!-- Header -->
                <div class="header">
                  <div class="header-badge">Instructor Approval</div>
                  <h1>You have been approved!</h1>
                  <p>Welcome to the Unfiltered IITians Instructor Community</p>
                </div>

                <!-- Content -->
                <div class="content">
                  <p class="greeting">Dear ${name},</p>
                  <p class="intro">
                    We are delighted to inform you that your instructor application has been
                    reviewed and <strong>officially approved</strong> by our academic team. You are
                    now a verified instructor on the <strong>Unfiltered IITians</strong> platform,
                    a learning community built for aspiring IITians and driven by excellence.
                  </p>

                  <!-- Approval Stamp -->
                  <div class="approval-box">
                    <div class="approval-icon">🎓</div>
                    <h2>Application Approved</h2>
                    ${title}
                    <p>Your profile is now active and visible to learners on the platform.</p>
                    <div class="approval-date">Approved on ${approvalDate}</div>
                  </div>

                  <!-- Profile Info -->
                  <div class="info-grid">
                    <div class="info-item">
                      <p class="info-label">Name</p>
                      <p class="info-value">${name}</p>
                    </div>
                    <div class="info-item">
                      <p class="info-label">Registered Email</p>
                      <p class="info-value">${data.instructorEmail || '—'}</p>
                    </div>
                  </div>

                  ${notesHtml}

                  <!-- Assigned Courses -->
                  <p class="section-title">Courses Assigned to You</p>
                  <div class="courses-box">
                    <ul>
                      ${coursesHtml}
                    </ul>
                  </div>

                  <p style="font-size:13px;color:#9ca3af;margin:10px 0 0;">
                    Your name and profile will now appear on the associated course pages. If any
                    courses are to be updated, our admin team will reach out to you directly.
                  </p>

                  <hr class="divider" />

                  <!-- What's Next -->
                  <p class="section-title">What Happens Next</p>
                  <ul style="padding-left:20px;color:#4b5563;font-size:14px;">
                    <li style="margin:8px 0;">Your instructor profile is now <strong>live</strong> on the platform.</li>
                    <li style="margin:8px 0;">Students enrolled in your assigned course(s) will see your bio and credentials.</li>
                    <li style="margin:8px 0;">Our team may contact you for content creation, live sessions, or further collaboration.</li>
                    <li style="margin:8px 0;">You can reach us at any time for queries or updates regarding your profile.</li>
                  </ul>

                  <div class="cta-section">
                    <a href="${baseUrl}" class="btn">Visit the Platform</a>
                  </div>

                  <hr class="divider" />

                  <p class="closing">
                    On behalf of the entire Unfiltered IITians team, we are truly honoured to
                    have you as part of our academic family. Your expertise and experience will
                    be an invaluable asset to thousands of determined learners on this platform.
                  </p>
                  <p class="closing">We look forward to a wonderful collaboration ahead.</p>

                  <p class="signature">Warm regards,</p>
                  <p class="signature">Divyanshu Darshna</p>
                  <p class="signature-role">Founder &amp; Academic Head, Unfiltered IITians</p>
                </div>

                <!-- Footer -->
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Unfiltered IITians by Divyanshu Darshna. All rights reserved.</p>
                  <p><a href="${baseUrl}">Visit Website</a> &nbsp;|&nbsp; <a href="${baseUrl}/courses">Browse Courses</a></p>
                  <p style="margin-top:8px;color:#d1d5db;">This is an automated confirmation email. Please do not reply directly to this message.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      };
    }

    default:
      return {
        subject: 'Notification from Unfiltered IITians',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #667eea; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              .brand { color: #667eea; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Unfiltered IITians</h1>
              </div>
              <div class="content">
                <h2>Hello ${data.userName || 'Student'}!</h2>
                ${data.additionalInfo ? `<p>${data.additionalInfo}</p>` : '<p>You have a new notification.</p>'}
                
                <center>
                  <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
                </center>
                
                <p>Best regards,<br>
                <strong class="brand">Unfiltered IITians</strong><br>
                <em>by Divyanshu Darshna</em></p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Unfiltered IITians by Divyanshu Darshna. All rights reserved.</p>
                <p><a href="${baseUrl}" style="color: #667eea; text-decoration: none;">Visit Website</a> | <a href="${baseUrl}/courses" style="color: #667eea; text-decoration: none;">Browse Courses</a></p>
              </div>
            </div>
          </body>
          </html>
        `
      };
  }
};

// Send email function
export async function sendEmail({
  to,
  template,
  data,
  customSubject,
  customHtml,
  source,
  sentBy,
  metadata,
  attachments,
}: {
  to: string;
  template?: EmailTemplate;
  data?: EmailData;
  customSubject?: string;
  customHtml?: string;
  source?: string;
  sentBy?: string;
  metadata?: Record<string, unknown>;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}) {
  try {
    const transporter = createTransporter();
    
    let subject: string;
    let html: string;

    if (customSubject && customHtml) {
      // Custom email
      subject = customSubject;
      html = customHtml;
    } else if (template) {
      // Template-based email
      const emailContent = getEmailTemplate(template, data || {});
      subject = emailContent.subject;
      html = emailContent.html;
    } else {
      throw new Error('Either provide a template with data or customSubject with customHtml');
    }

    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@unfilterediitians.com';

    const mailOptions: nodemailer.SendMailOptions = {
      from: `Unfiltered IITians <${fromAddress}>`,
      to,
      subject,
      html,
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    const info = await transporter.sendMail(mailOptions);
    
    // Log email to database if source is provided (indicating admin-sent email)
    if (source) {
      try {
        await prisma.emailLog.create({
          data: {
            subject,
            body: html,
            recipients: Array.isArray(to) ? to : [to],
            recipientCount: Array.isArray(to) ? to.length : 1,
            sentBy: sentBy || 'Unknown',
            source,
            metadata: (metadata ?? {}) as Prisma.InputJsonObject,
          },
        });
      } catch (logError) {
        console.error('Failed to log email to database:', logError);
        // Don't fail the email send if logging fails
      }
    }
    
    return {
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully',
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

// Verify email configuration
export async function verifyEmailConfig() {
  try {
  
  
  
  
  
  

    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email configuration failed',
    };
  }
}
