import express from "express";
import upload from "../middleware/multer.middleware.js";
import {
  addStore,
  updateStore,
  getStores,
  deleteStore
} from "../controllers/storeInfoController.js";
import isUserAuthenticated from "../middleware/isUserAuthenticated.js";

const router = express.Router();

// Upload Image and Video Middleware
router.post(
  "/add",
  isUserAuthenticated,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  addStore
); // Add new item 

router.get("/all", isUserAuthenticated, getStores); // Get all items

router.put(
  "/edit/:id",
  isUserAuthenticated,

  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  updateStore
); 

router.delete("/delete/:id", isUserAuthenticated, deleteStore); // Delete item by ID

export default router;
