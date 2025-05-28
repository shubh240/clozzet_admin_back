import express from "express";
import upload from "../middleware/multer.middleware.js";
import isUserAuthenticated from "../middleware/isUserAuthenticated.js";
import { createColor, getColors, updateColor, deleteColor } from "../controllers/colorController.js";

const router = express.Router();

// Upload Image and Video Middleware
router.post(
  "/add-color",
  isUserAuthenticated,
  upload.fields([
    { name: "image", maxCount: 1 }
  ]),
  createColor
); 

router.get("/list-colors", getColors);

router.put(
  "/edit-color/:id",
  isUserAuthenticated,
  upload.fields([
    { name: "image", maxCount: 1 }
  ]),
  updateColor
); 

router.delete("/delete-color/:id", isUserAuthenticated, deleteColor);

export default router;
