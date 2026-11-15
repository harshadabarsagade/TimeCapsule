const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createCapsule,
  getMyCapsules,
  deleteCapsule
} = require("../controllers/capsuleController");

const router = express.Router();
router.use(authMiddleware);
router.get("/", getMyCapsules);
router.post("/", createCapsule);
router.delete("/:id", deleteCapsule);

module.exports = router;
