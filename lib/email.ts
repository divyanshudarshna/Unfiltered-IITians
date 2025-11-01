import nodemailer from 'nodemailer';

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
    },
  });
};

// Email template types
export type EmailTemplate = 
  | 'welcome'
  | 'course_purchase'
  | 'mock_purchase'
  | 'guidance_session'
  | 'subscription'
  | 'custom';

interface EmailData {
  userName?: string;
  courseName?: string;
  mockName?: string;
  sessionDate?: string;
  sessionTime?: string;
  purchaseAmount?: string;
  additionalInfo?: string;
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
        subject: `📅 Guidance Session Booked - ${data.sessionDate || 'Upcoming'}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #fa709a; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
              .button-secondary { background: #667eea; }
              .session-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #fa709a; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              .important { background: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0; }
              .brand { color: #fa709a; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎓 Guidance Session Confirmed!</h1>
              </div>
              <div class="content">
                <h2>Hello ${data.userName || 'Student'}!</h2>
                <p>Your guidance session has been successfully booked. We look forward to helping you!</p>
                
                <div class="session-details">
                  <h3>📅 Session Details</h3>
                  ${data.sessionDate ? `<p><strong>Date:</strong> ${data.sessionDate}</p>` : ''}
                  ${data.sessionTime ? `<p><strong>Time:</strong> ${data.sessionTime}</p>` : ''}
                  ${data.purchaseAmount ? `<p><strong>Amount Paid:</strong> ₹${data.purchaseAmount}</p>` : ''}
                </div>
                
                <div class="important">
                  <strong>⏰ Important Reminders:</strong>
                  <ul>
                    <li>Join the session 5 minutes early</li>
                    <li>Prepare your questions beforehand</li>
                    <li>Keep a notebook handy</li>
                  </ul>
                </div>
                
                <p>You'll receive the meeting link closer to the session date.</p>
                
                <center>
                  <a href="${dashboardUrl}" class="button">View Dashboard</a>
                  <a href="${baseUrl}/guidance" class="button button-secondary">Browse More Sessions</a>
                </center>
                
                <p>Best regards,<br>
                <strong class="brand">Unfiltered IITians</strong><br>
                <em>by Divyanshu Darshna</em></p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Unfiltered IITians by Divyanshu Darshna. All rights reserved.</p>
                <p><a href="${baseUrl}" style="color: #fa709a; text-decoration: none;">Visit Website</a> | <a href="${baseUrl}/courses" style="color: #fa709a; text-decoration: none;">Browse Courses</a></p>
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
}: {
  to: string;
  template?: EmailTemplate;
  data?: EmailData;
  customSubject?: string;
  customHtml?: string;
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

    const mailOptions = {
      from: `Unfiltered IITians <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    
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
