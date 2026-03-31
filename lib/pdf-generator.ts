// lib/pdf-generator.ts
import puppeteer from 'puppeteer';

interface CertificateData {
  studentName: string;
  courseName: string;
  completionDate: Date;
  certificateId: string;
  durationMonths?: number;
}

export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 900 });

    // Generate the certificate HTML
    const html = generateCertificateHTML(data);

    // Set content and wait for fonts/images to load
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdf = await page.pdf({
      width: '11in',
      height: '8.5in',
      printBackground: true,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

function generateCertificateHTML(data: CertificateData): string {
  const formattedDate = new Date(data.completionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
        }

        .certificate-container {
          background: white;
          width: 1100px;
          padding: 60px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          border: 20px solid transparent;
          background-clip: padding-box;
          position: relative;
        }

        .certificate-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 20px solid;
          border-image: linear-gradient(135deg, #d4af37 0%, #f9d423 50%, #d4af37 100%) 1;
          pointer-events: none;
        }

        .certificate-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .logo-container {
          margin-bottom: 20px;
        }

        .logo {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 6px solid #d4af37;
          object-fit: cover;
          margin: 0 auto;
          display: block;
          box-shadow: 0 8px 20px rgba(212, 175, 55, 0.3);
        }

        .certificate-title {
          font-family: 'Playfair Display', serif;
          font-size: 48px;
          color: #1a1a1a;
          margin: 20px 0;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .subtitle {
          font-size: 18px;
          color: #666;
          font-weight: 500;
        }

        .certificate-body {
          text-align: center;
          margin: 50px 0;
          padding: 40px 60px;
          background: linear-gradient(to bottom, transparent, #f9f9f9, transparent);
        }

        .awarded-text {
          font-size: 20px;
          color: #666;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 3px;
          font-weight: 600;
        }

        .student-name {
          font-family: 'Playfair Display', serif;
          font-size: 56px;
          color: #1a1a1a;
          margin: 30px 0;
          font-weight: 700;
          border-bottom: 3px solid #d4af37;
          padding-bottom: 15px;
          display: inline-block;
        }

        .completion-text {
          font-size: 18px;
          color: #444;
          margin: 30px 0;
          line-height: 1.8;
        }

        .course-name {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          color: #d4af37;
          font-weight: 700;
          margin: 20px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .duration {
          font-size: 16px;
          color: #666;
          margin-top: 10px;
        }

        .certificate-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 60px;
          padding-top: 40px;
          border-top: 2px solid #e0e0e0;
        }

        .footer-section {
          text-align: center;
          flex: 1;
        }

        .signature-line {
          border-top: 2px solid #333;
          width: 200px;
          margin: 0 auto 10px;
        }

        .footer-label {
          font-size: 14px;
          color: #666;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .footer-name {
          font-size: 18px;
          color: #1a1a1a;
          font-weight: 700;
          margin-top: 5px;
        }

        .footer-title {
          font-size: 14px;
          color: #888;
          font-style: italic;
        }

        .seal-container {
          position: relative;
          width: 100px;
          height: 100px;
        }

        .seal {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, #d4af37 0%, #f9d423 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
          border: 3px solid #fff;
          outline: 2px solid #d4af37;
        }

        .seal-text {
          font-size: 12px;
          color: #1a1a1a;
          font-weight: 700;
          text-align: center;
          line-height: 1.2;
        }

        .certificate-id {
          text-align: center;
          margin-top: 30px;
          font-size: 12px;
          color: #999;
          font-family: monospace;
          letter-spacing: 1px;
        }

        .ornament {
          color: #d4af37;
          font-size: 24px;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="certificate-container">
        <div class="certificate-header">
          <div class="logo-container">
            <img src="https://res.cloudinary.com/dbvlxypga/image/upload/v1739100754/Logo_bhpgix.png" alt="Unfiltered IITians Logo" class="logo">
          </div>
          <h1 class="certificate-title">Certificate of Completion</h1>
          <p class="subtitle">Unfiltered IITians</p>
        </div>

        <div class="certificate-body">
          <div class="ornament">✦ ✦ ✦</div>
          <p class="awarded-text">This certificate is proudly presented to</p>
          
          <div class="student-name">${data.studentName}</div>
          
          <p class="completion-text">
            for successfully completing the comprehensive course
          </p>
          
          <div class="course-name">${data.courseName}</div>
          
          ${data.durationMonths ? `<p class="duration">Duration: ${data.durationMonths} month${data.durationMonths > 1 ? 's' : ''}</p>` : ''}
          
          <p class="completion-text" style="margin-top: 30px;">
            This achievement demonstrates dedication, commitment, and mastery<br>
            of the subject matter.
          </p>
          <div class="ornament">✦ ✦ ✦</div>
        </div>

        <div class="certificate-footer">
          <div class="footer-section">
            <div class="signature-line"></div>
            <div class="footer-label">Date</div>
            <div class="footer-name">${formattedDate}</div>
          </div>

          <div class="footer-section">
            <div class="seal-container">
              <div class="seal">
                <div class="seal-text">
                  VERIFIED<br>
                  CERTIFICATE
                </div>
              </div>
            </div>
          </div>

          <div class="footer-section">
            <div class="signature-line"></div>
            <div class="footer-label">Instructor</div>
            <div class="footer-name">Divyanshu Darshna</div>
            <div class="footer-title">Founder, Unfiltered IITians</div>
          </div>
        </div>

        <div class="certificate-id">
          Certificate ID: ${data.certificateId}
        </div>
      </div>
    </body>
    </html>
  `;
}
