
const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error(
      "Email is not configured. Add MAIL_USER and MAIL_PASS in backend/.env"
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.MAIL_PORT || 465),
      secure: String(process.env.MAIL_SECURE || "true") === "true",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });
  }

  return transporter;
}

async function sendCapsuleEmail(capsule) {
  try {
    const mailer = getTransporter();

    const info = await mailer.sendMail({
      from: process.env.MAIL_FROM || process.env.MAIL_USER,
      to: capsule.recipientEmail,
      subject: `A message from the past: ${capsule.subject}`,
      text:
        `Hello ${capsule.recipientName},\n\n` +
        `You have received a TimeCapsule message.\n\n` +
        `${capsule.message}\n\n` +
        `This message was scheduled in advance with TimeCapsule.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#243047">
          <h2 style="color:#6558d3">A message from the past ✨</h2>
          <p>Hello ${escapeHtml(capsule.recipientName)},</p>
          <p>You have received a TimeCapsule message:</p>
          <div style="background:#f4f2ff;padding:20px;border-radius:12px;white-space:pre-wrap">${escapeHtml(capsule.message)}</div>
          <p style="color:#68738a;font-size:13px">This message was scheduled in advance with TimeCapsule.</p>
        </div>`
    });

    console.log("Email sent successfully:", info.messageId);
    return info;

  } catch (error) {
    console.error("Email sending failed:", {
      code: error.code,
      response: error.response,
      message: error.message
    });

    throw error;
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

module.exports = { sendCapsuleEmail };
