const cron = require("node-cron");
const Capsule = require("../models/Capsule");
const { sendCapsuleEmail } = require("../services/mailService");
const { emitToUser } = require("../services/socketService");

function startCapsuleScheduler() {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // Recover capsules stuck in sending status for over 10 minutes.
      const staleBefore = new Date(now.getTime() - 10 * 60 * 1000);

      const dueCapsules = await Capsule.find({
        $or: [
          {
            status: "scheduled",
            deliveryDate: { $lte: now }
          },
          {
            status: "sending",
            updatedAt: { $lte: staleBefore }
          }
        ]
      })
        .select("_id")
        .limit(50);

      for (const item of dueCapsules) {
        try {
          // Atomically claim the capsule to prevent concurrent processing.
          const capsule = await Capsule.findOneAndUpdate(
            {
              _id: item._id,
              $or: [
                {
                  status: "scheduled",
                  deliveryDate: { $lte: now }
                },
                {
                  status: "sending",
                  updatedAt: { $lte: staleBefore }
                }
              ]
            },
            {
              $set: { status: "sending" },
              $inc: { attempts: 1 }
            },
            { new: true }
          );

          if (!capsule) continue;

          emitToUser(capsule.owner.toString(), "capsule-status-updated", {
            capsuleId: capsule._id.toString(),
            status: "sending"
          });

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

          console.log(`Capsule ${capsule._id} delivered successfully`);

        } catch (error) {
          console.error(`Capsule ${item._id} failed:`, error.message);

          try {
            const failedCapsule = await Capsule.findOneAndUpdate(
              {
                _id: item._id,
                status: "sending"
              },
              {
                $set: {
                  status: "failed",
                  lastError: error.message
                }
              },
              { new: true }
            );

            if (failedCapsule) {
              emitToUser(failedCapsule.owner.toString(), "capsule-status-updated", {
                capsuleId: failedCapsule._id.toString(),
                status: "failed"
              });
            }
          } catch (saveError) {
            console.error("Could not save capsule failure:", saveError.message);
          }
        }
      }
    } catch (error) {
      console.error("Capsule scheduler error:", error.message);
    }
  });

  console.log("Capsule scheduler started (checks every minute)");
}

module.exports = startCapsuleScheduler;