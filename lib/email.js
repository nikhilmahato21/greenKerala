import nodemailer from 'nodemailer'

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export async function sendMail({ to, subject, html }) {
  const transporter = getTransporter()
  await transporter.sendMail({
    from: `"Green Kerala Trips" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  })
}

export async function sendOtpEmail(to, otp) {
  await sendMail({
    to,
    subject: 'Your Green Kerala Trips Verification Code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:16px;border:1px solid #e5e7eb">
        <div style="text-align:center;margin-bottom:24px">
          <div style="display:inline-block;background:linear-gradient(135deg,#e8520a,#c93d00);border-radius:12px;padding:12px 20px">
            <span style="font-size:20px;font-weight:800;color:#fff">Green Kerala Trips</span>
          </div>
        </div>
        <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px">Email Verification</h2>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px">
          Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.
        </p>
        <div style="background:#f5f0e8;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
          <span style="font-size:40px;font-weight:800;letter-spacing:10px;color:#e8520a;font-family:monospace">${otp}</span>
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
    `,
  })
}

export async function sendEnquiryEmail({ name, phone, email, message, package_title }) {
  const to = process.env.ENQUIRY_EMAIL || process.env.SMTP_USER
  await sendMail({
    to,
    subject: `New Enquiry: ${package_title || 'General'} — ${name}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:16px;border:1px solid #e5e7eb">
        <div style="text-align:center;margin-bottom:24px">
          <div style="display:inline-block;background:linear-gradient(135deg,#e8520a,#c93d00);border-radius:12px;padding:12px 20px">
            <span style="font-size:20px;font-weight:800;color:#fff">Green Kerala Trips</span>
          </div>
        </div>
        <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 16px">New Enquiry Received</h2>
        ${package_title ? `<div style="background:#fff5ef;border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:14px;color:#e8520a;font-weight:600">📦 ${package_title}</div>` : ''}
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#6b7280;width:90px">Name</td><td style="padding:8px 0;color:#111;font-weight:600">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Phone</td><td style="padding:8px 0;color:#111;font-weight:600">${phone}</td></tr>
          ${email ? `<tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0;color:#111;font-weight:600">${email}</td></tr>` : ''}
          ${message ? `<tr><td style="padding:8px 0;color:#6b7280;vertical-align:top">Message</td><td style="padding:8px 0;color:#111">${message}</td></tr>` : ''}
        </table>
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin:24px 0 0">
          Green Kerala Trips · Kerala, India
        </p>
      </div>
    `,
  })
}

export async function sendApprovalEmail(to, agencyName) {
  await sendMail({
    to,
    subject: '🎉 Your Agency has been Approved — Green Kerala Trips',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:16px;border:1px solid #e5e7eb">
        <div style="text-align:center;margin-bottom:24px">
          <div style="display:inline-block;background:linear-gradient(135deg,#e8520a,#c93d00);border-radius:12px;padding:12px 20px">
            <span style="font-size:20px;font-weight:800;color:#fff">Green Kerala Trips</span>
          </div>
        </div>
        <div style="text-align:center;margin-bottom:20px">
          <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#16a34a);display:inline-flex;align-items:center;justify-content:center">
            <span style="font-size:28px">✓</span>
          </div>
        </div>
        <h2 style="font-size:22px;font-weight:800;color:#111;text-align:center;margin:0 0 12px">Application Approved!</h2>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;text-align:center;margin:0 0 24px">
          Congratulations, <strong>${agencyName}</strong>! Your agency has been approved on Green Kerala Trips. You can now log in to your dashboard and start listing packages.
        </p>
        <div style="text-align:center">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/agency"
            style="display:inline-block;padding:13px 32px;border-radius:999px;background:linear-gradient(135deg,#e8520a,#c93d00);color:#fff;font-weight:700;font-size:15px;text-decoration:none">
            Go to Agency Login
          </a>
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin:24px 0 0">
          Green Kerala Trips · Kerala, India
        </p>
      </div>
    `,
  })
}
