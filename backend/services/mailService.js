
async function sendCapsuleEmail(capsule) {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is missing");
    }

    if (!process.env.GMAIL_USER) {
      throw new Error("GMAIL_USER is missing");
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: "TimeCapsule",
          email: process.env.GMAIL_USER
        },
        to: [
          {
            email: capsule.recipientEmail,
            name: capsule.recipientName
          }
        ],
        subject: `A message from the past: ${capsule.subject}`,
        textContent:
          `Hello ${capsule.recipientName},\n\n` +
          `You have received a TimeCapsule message.\n\n` +
          `${capsule.message}\n\n` +
          `This message was scheduled in advance with TimeCapsule.`,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#243047">
            <h2 style="color:#6558d3">A message from the past ✨</h2>
            <p>Hello ${escapeHtml(capsule.recipientName)},</p>
            <p>You have received a TimeCapsule message:</p>
            <div style="background:#f4f2ff;padding:20px;border-radius:12px;white-space:pre-wrap">${escapeHtml(capsule.message)}</div>
            <p style="color:#68738a;font-size:13px">
              This message was scheduled in advance with TimeCapsule.
            </p>
          </div>`
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(result));
    }

    console.log("Email sent successfully:", result.messageId);
    return result;

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
