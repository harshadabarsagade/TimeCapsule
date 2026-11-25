const Capsule = require("../models/Capsule");
const { emitToUser } = require("../services/socketService");

function getDeliveryDate(value) {
  const date = new Date(`${value}+05:30`);

  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
    return null;
  }

  return date;
}

function validateCapsuleFields(fields) {
  const { recipientName, recipientEmail, subject, message, deliveryDate } = fields;

  if (
    !recipientName?.trim() ||
    !recipientEmail?.trim() ||
    !subject?.trim() ||
    !message?.trim() ||
    !deliveryDate
  ) {
    return { error: "Please fill in every field." };
  }

  if (recipientName.trim().length > 80) {
    return { error: "Recipient name cannot exceed 80 characters." };
  }

  if (subject.trim().length > 120) {
    return { error: "Subject cannot exceed 120 characters." };
  }

  if (message.length > 10000) {
    return { error: "Message cannot exceed 10000 characters." };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(recipientEmail.trim())) {
    return { error: "Please enter a valid recipient email." };
  }

  const date = getDeliveryDate(deliveryDate);

  if (!date) {
    return { error: "Choose a delivery date and time in the future." };
  }

  return {
    data: {
      recipientName: recipientName.trim(),
      recipientEmail: recipientEmail.trim().toLowerCase(),
      subject: subject.trim(),
      message,
      deliveryDate: date
    }
  };
}

async function createCapsule(req, res) {
  try {
    const validation = validateCapsuleFields(req.body);

    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const capsule = await Capsule.create({
      owner: req.user.id,
      ...validation.data
    });

    emitToUser(req.user.id, "capsule-created", { capsule });

    res.status(201).json({
      message: "Your TimeCapsule has been scheduled.",
      capsule
    });
  } catch (error) {
    console.error("Create capsule error:", error.message);
    res.status(500).json({ message: "Could not schedule your capsule." });
  }
}

async function getMyCapsules(req, res) {
  try {
    const capsules = await Capsule.find({ owner: req.user.id })
      .sort({ deliveryDate: 1 });

    res.json({ capsules });
  } catch (error) {
    console.error("Get capsules error:", error.message);
    res.status(500).json({ message: "Could not load your capsules." });
  }
}

async function updateCapsule(req, res) {
  try {
    const validation = validateCapsuleFields(req.body);

    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const capsule = await Capsule.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user.id,
        status: "scheduled"
      },
      {
        $set: validation.data
      },
      { new: true, runValidators: true }
    );

    if (!capsule) {
      return res.status(404).json({
        message: "Scheduled capsule not found or cannot be edited."
      });
    }

    emitToUser(req.user.id, "capsule-status-updated", {
      capsuleId: capsule._id.toString(),
      status: capsule.status
    });

    res.json({
      message: "Capsule updated successfully.",
      capsule
    });
  } catch (error) {
    console.error("Update capsule error:", error.message);
    res.status(500).json({ message: "Could not update capsule." });
  }
}

async function deleteCapsule(req, res) {
  try {
    const capsule = await Capsule.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
      status: { $ne: "sending" }
    });

    if (!capsule) {
      return res.status(404).json({
        message: "Capsule not found or cannot be deleted."
      });
    }

    emitToUser(req.user.id, "capsule-deleted", {
      capsuleId: capsule._id.toString()
    });

    res.json({ message: "Scheduled capsule deleted." });
  } catch (error) {
    console.error("Delete capsule error:", error.message);
    res.status(500).json({ message: "Could not delete capsule." });
  }
}

async function retryCapsule(req, res) {
  try {
    const capsule = await Capsule.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user.id,
        status: "failed"
      },
      {
        $set: {
          status: "scheduled",
          deliveryDate: new Date(Date.now() - 1000),
          lastError: ""
        }
      },
      { new: true, runValidators: true }
    );

    if (!capsule) {
      return res.status(404).json({
        message: "Failed capsule not found or cannot be retried."
      });
    }

    emitToUser(req.user.id, "capsule-status-updated", {
      capsuleId: capsule._id.toString(),
      status: "scheduled"
    });

    res.json({
      message: "Capsule queued for retry. It will be processed by the scheduler.",
      capsule
    });
  } catch (error) {
    console.error("Retry capsule error:", error.message);
    res.status(500).json({ message: "Could not retry capsule." });
  }
}

module.exports = {
  createCapsule,
  getMyCapsules,
  updateCapsule,
  deleteCapsule,
  retryCapsule
};