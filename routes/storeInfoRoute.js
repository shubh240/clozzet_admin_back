import express from "express";
import upload from "../middleware/multer.middleware.js";
import {
  addStore,
  updateStore,
  getStores,
  deleteStore,
  getStoreById,
  toggleStoreStatus,
  toggleStoreActive,
  updateSellerPassword,
  checkStoreOpenClose,
} from "../controllers/storeInfoController.js";
import isUserAuthenticated ,{isSuperAdminAuthenticated} from "../middleware/isUserAuthenticated.js";

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

router.get("/details-store/:id", isUserAuthenticated, getStoreById);

router.delete("/delete-store/:id", isUserAuthenticated, deleteStore);

router.put("/toggle-status-store/:id", isUserAuthenticated, toggleStoreStatus);

router.put("/toggle-active-store/:id", isSuperAdminAuthenticated, toggleStoreActive);

router.put(
  "/edit-password/:id",
  isUserAuthenticated,
  updateSellerPassword
);

router.get("/cron/store-on-off", checkStoreOpenClose);

export default router;
