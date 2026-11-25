const Capsule = require("../models/Capsule");
const { emitToUser } = require("../services/socketService");

async function createCapsule(req, res) {
  try {
    const { recipientName, recipientEmail, subject, message, deliveryDate } = req.body;
    if (!recipientName || !recipientEmail || !subject || !message || !deliveryDate) {
      return res.status(400).json({ message: "Please fill in every field." });
    }

    const date = new Date(`${deliveryDate}+05:30`);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      return res.status(400).json({ message: "Choose a delivery date and time in the future." });
    }

    const capsule = await Capsule.create({
      owner: req.user.id,
      recipientName,
      recipientEmail,
      subject,
      message,
      deliveryDate: date
    });

    emitToUser(req.user.id, "capsule-created", { capsule });
    res.status(201).json({ message: "Your TimeCapsule has been scheduled.", capsule });
  } catch (error) {
    console.error("Create capsule error:", error);
    res.status(500).json({ message: "Could not schedule your capsule." });
  }
}

async function getMyCapsules(req, res) {
  try {
    const capsules = await Capsule.find({ owner: req.user.id }).sort({ deliveryDate: 1 });
    res.json({ capsules });
  } catch (error) {
    console.error("Get capsules error:", error);
    res.status(500).json({ message: "Could not load your capsules." });
  }
}

async function deleteCapsule(req, res) {
  try {
    const capsule = await Capsule.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
      status: "scheduled"
    });
    if (!capsule) return res.status(404).json({ message: "Scheduled capsule not found." });

    emitToUser(req.user.id, "capsule-deleted", { capsuleId: capsule._id.toString() });
    res.json({ message: "Scheduled capsule deleted." });
  } catch (error) {
    console.error("Delete capsule error:", error);
    res.status(500).json({ message: "Could not delete capsule." });
  }
}

module.exports = { createCapsule, getMyCapsules, deleteCapsule };
