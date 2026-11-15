const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Initialize Email Transporter
 * Uses configured SMTP credentials if provided in .env,
 * or automatically generates a zero-config Ethereal test transporter for local testing.
 */
const initTransporter = async () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
    console.log(`📧 Email Service configured with SMTP Host: ${SMTP_HOST}`);
  } else {
    try {
      // Create temporary Ethereal test account (zero-config, web-previewable)
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`📧 Email Service running in Ethereal Test Mode (Zero setup required). Test account: ${testAccount.user}`);
    } catch (err) {
      console.warn('⚠️  Could not create Ethereal test account. Operating in simulated logging mode:', err.message);
      // Fallback stub transporter
      transporter = {
        sendMail: async (mailOptions) => {
          console.log('\n----------------- [SIMULATED EMAIL DISPATCH] -----------------');
          console.log(`To: ${mailOptions.to}`);
          console.log(`Subject: ${mailOptions.subject}`);
          console.log(`Ticket: ${mailOptions.ticketId || 'N/A'}`);
          console.log('--------------------------------------------------------------\n');
          return { messageId: 'sim_' + Date.now(), previewUrl: null };
        }
      };
    }
  }

  return transporter;
};

/**
 * Send Ticket Confirmation Email with Styled HTML Template
 */
const sendTicketConfirmationEmail = async ({
  email,
  name,
  ticketId,
  eventTitle,
  venue,
  date,
  seats,
  seatSection
}) => {
  try {
    const mailer = await initTransporter();

    const formattedDate = date
      ? new Date(date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Upcoming Event';

    const seatsDisplay = Array.isArray(seats) && seats.length > 0 ? seats.join(', ') : 'General Admission';
    const tierDisplay = seatSection || 'Standard Tier';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #14213d 0%, #4338ca 100%); color: #ffffff; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
        .header p { margin: 8px 0 0; opacity: 0.85; font-size: 14px; }
        .body-content { padding: 30px; }
        .greeting { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #1e293b; }
        .ticket-box { background: #f1f5f9; border: 2px dashed #6366f1; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
        .ticket-id { font-family: monospace; font-size: 18px; font-weight: 800; color: #4338ca; letter-spacing: 1px; }
        .seat-highlight { font-size: 22px; font-weight: 800; color: #14213d; margin: 10px 0; }
        .details-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .details-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .details-table td.label { font-weight: 600; color: #64748b; width: 35%; }
        .guidelines { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px; border-radius: 6px; font-size: 13px; color: #92400e; margin: 25px 0 15px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🏛️ VAMS CAMPUS PORTAL</h1>
          <p>Official Event Entry Pass & RSVP Confirmation</p>
        </div>
        <div class="body-content">
          <div class="greeting">Hello ${name || 'Student'},</div>
          <p>Great news! Your seat reservation for <strong>${eventTitle || 'Campus Event'}</strong> has been successfully confirmed.</p>
          
          <div class="ticket-box">
            <div style="font-size: 12px; font-weight: 700; color: #6366f1; text-transform: uppercase;">Official Ticket ID</div>
            <div class="ticket-id">${ticketId}</div>
            <div class="seat-highlight">💺 Seat(s): ${seatsDisplay}</div>
            <div style="font-size: 13px; color: #166534; font-weight: 700;">Tier: ${tierDisplay} • Turnstile Gate A</div>
          </div>

          <table class="details-table">
            <tr>
              <td class="label">Event:</td>
              <td><strong>${eventTitle}</strong></td>
            </tr>
            <tr>
              <td class="label">Date & Time:</td>
              <td>${formattedDate}</td>
            </tr>
            <tr>
              <td class="label">Venue:</td>
              <td>${venue || 'University Auditorium'}</td>
            </tr>
            <tr>
              <td class="label">Attendee Name:</td>
              <td>${name}</td>
            </tr>
            <tr>
              <td class="label">Registered Email:</td>
              <td>${email}</td>
            </tr>
          </table>

          <div class="guidelines">
            <strong>📌 Entry Instructions:</strong>
            <ul style="margin: 6px 0 0; padding-left: 18px;">
              <li>Please keep this email or your downloaded PDF pass handy at the gate.</li>
              <li>Carry a valid College Photo ID Card for verification.</li>
              <li>Entry gates close strictly 15 minutes before event start time.</li>
            </ul>
          </div>
        </div>
        <div class="footer">
          © 2026 VAMS Smart Event Management Consortium. All rights reserved.<br>
          Automated confirmation sent by CampusSync Notification Engine.
        </div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"VAMS Campus Events" <${process.env.EMAIL_FROM || 'no-reply@vams-events.edu'}>`,
      to: email,
      subject: `🎉 Ticket Confirmed: ${eventTitle} (Seat: ${seatsDisplay})`,
      text: `Hello ${name},\n\nYour registration for ${eventTitle} is confirmed!\nTicket ID: ${ticketId}\nSeats: ${seatsDisplay}\nVenue: ${venue}\nDate: ${formattedDate}\n\nPlease carry your college ID.\n\nBest regards,\nVAMS Event Team`,
      html: htmlContent,
      ticketId
    };

    const info = await mailer.sendMail(mailOptions);
    let previewUrl = null;
    if (nodemailer.getTestMessageUrl) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 Ethereal Email Web Preview: ${previewUrl}`);
      }
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl
    };
  } catch (error) {
    console.error('❌ Failed to send confirmation email:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendTicketConfirmationEmail,
  initTransporter
};
