const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  createCapsule,
  getMyCapsules,
  updateCapsule,
  deleteCapsule,
  retryCapsule
} = require("../controllers/capsuleController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getMyCapsules);
router.post("/", createCapsule);
router.put("/:id", updateCapsule);
router.delete("/:id", deleteCapsule);
router.post("/:id/retry", retryCapsule);

module.exports = router;