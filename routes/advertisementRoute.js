import express from "express";
import upload from "../middleware/multer.middleware.js";
import isUserAuthenticated , {isSuperAdminAuthenticated} from "../middleware/isUserAuthenticated.js";
import { createAdvertisement, getAdvertisement,updateAdvertisement, deleteAdvertisement, showAdvertisement, statusAdvertisement } from "../controllers/advertisementController.js";

const router = express.Router();

router.post(
  "/add-advertisement",
  isSuperAdminAuthenticated,
  upload.fields([
    { name: "image", maxCount: 1 }
  ]),
  createAdvertisement
); 

router.get("/list-advertisement", getAdvertisement);

router.put(
  "/edit-advertisement/:id",
  isSuperAdminAuthenticated,
  upload.fields([
    { name: "image", maxCount: 1 }
  ]),
  updateAdvertisement
); 

router.delete("/delete-advertisement/:id", isSuperAdminAuthenticated, deleteAdvertisement);

router.get("/show-advertisement/:id", isUserAuthenticated, showAdvertisement);

router.patch("/status-advertisement/:id", isSuperAdminAuthenticated, statusAdvertisement);

export default router;
