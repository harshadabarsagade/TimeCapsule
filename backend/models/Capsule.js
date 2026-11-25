const mongoose = require("mongoose");

const capsuleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    recipientName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },

    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },

    message: {
      type: String,
      required: true,
      maxlength: 10000
    },

    deliveryDate: {
      type: Date,
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ["scheduled", "sending", "sent", "failed"],
      default: "scheduled",
      index: true
    },

    sentAt: {
      type: Date,
      default: null
    },

    lastError: {
      type: String,
      default: ""
    },

    attempts: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Capsule", capsuleSchema);