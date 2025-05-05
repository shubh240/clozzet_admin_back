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
  "/add-store",
  isUserAuthenticated,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  addStore
); 

router.get("/list-stores", isUserAuthenticated, getStores); 

router.put(
  "/edit-store/:id",
  isUserAuthenticated,

  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  updateStore
); 

router.delete("/delete-store/:id", isUserAuthenticated, deleteStore); // Delete item by ID

export default router;
