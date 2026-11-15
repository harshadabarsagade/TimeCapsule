const cron = require("node-cron");
const Capsule = require("../models/Capsule");
const { sendCapsuleEmail } = require("../services/mailService");
const { emitToUser } = require("../services/socketService");

function startCapsuleScheduler() {
  // Check every minute. The database status prevents the same capsule being sent twice.
  cron.schedule("* * * * *", async () => {
    try {
      const dueCapsules = await Capsule.find({
        status: "scheduled",
        deliveryDate: { $lte: new Date() }
      }).limit(50);

      for (const capsule of dueCapsules) {
        try {
          await sendCapsuleEmail(capsule);
          capsule.status = "sent";
          capsule.sentAt = new Date();
          capsule.lastError = "";
          await capsule.save();

          emitToUser(capsule.owner.toString(), "capsule-status-updated", {
            capsuleId: capsule._id.toString(),
            status: "sent",
            sentAt: capsule.sentAt
          });
          console.log(`Capsule ${capsule._id} delivered`);
        } catch (error) {
          capsule.status = "failed";
          capsule.lastError = error.message;
          await capsule.save();

          emitToUser(capsule.owner.toString(), "capsule-status-updated", {
            capsuleId: capsule._id.toString(),
            status: "failed"
          });
          console.error(`Capsule ${capsule._id} failed:`, error.message);
        }
      }
    } catch (error) {
      console.error("Capsule scheduler error:", error);
    }
  });

  console.log("Capsule scheduler started (checks every minute)");
}

module.exports = startCapsuleScheduler;
