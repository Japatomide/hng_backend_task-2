import express from "express";
import {
  getProfiles,
  getProfileById,
  searchProfiles,
} from "../controllers/profileController.js";
const router = express.Router();

// GET /api/profiles - Advanced filtering, sorting, pagination
router.get("/profiles", getProfiles);

// GET /api/profiles/search - Natural language search
router.get("/profiles/search", searchProfiles);

// GET /api/profiles/:id - Get single profile
router.get("/profiles/:id", getProfileById);

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
