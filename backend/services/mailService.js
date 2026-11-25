const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("GMAIL_USER or GMAIL_APP_PASSWORD is missing");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, "")
      }
    });
  }

  return transporter;
}

async function sendCapsuleEmail(capsule) {
  try {
    const mailer = getTransporter();

    const info = await mailer.sendMail({
      from: `"TimeCapsule" <${process.env.GMAIL_USER}>`,
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
          <p style="color:#68738a;font-size:13px">
            This message was scheduled in advance with TimeCapsule.
          </p>
        </div>`
    });

    console.log("Email sent successfully:", info.messageId);
    return info;

  } catch (error) {
    console.error("Email sending failed:", error.message);
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
