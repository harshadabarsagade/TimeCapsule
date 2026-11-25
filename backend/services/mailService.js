
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendCapsuleEmail(capsule) {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing");
    }

    const { data, error } = await resend.emails.send({
      from: "TimeCapsule <onboarding@resend.dev>",
      to: [capsule.recipientEmail],
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

    if (error) {
      throw new Error(error.message);
    }

    console.log("Email sent successfully:", data.id);
    return data;

  } catch (error) {
    console.error("Email sending failed:", {
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
