import express from "express";
import upload from "../middleware/multer.middleware.js";
import isUserAuthenticated from "../middleware/isUserAuthenticated.js";
import { createBanner, deleteBanner, getBanner, showBanner, updateBanner } from "../controllers/bannerController.js";

const router = express.Router();

router.post(
  "/add-banner",
  isUserAuthenticated,
  upload.fields([
    { name: "image", maxCount: 1 }
  ]),
  createBanner
); 

router.get("/list-banner", getBanner);

router.put(
  "/edit-banner/:id",
  isUserAuthenticated,
  upload.fields([
    { name: "image", maxCount: 1 }
  ]),
  updateBanner
); 

router.delete("/delete-banner/:id", isUserAuthenticated, deleteBanner);

router.get("/show-banner/:id", isUserAuthenticated, showBanner);

export default router;
